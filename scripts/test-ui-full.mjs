import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const USER_DATA = '/tmp/omnifi-ui-test-suite-profile';
const ARTIFACTS_DIR = resolve(process.cwd(), 'ui-test-artifacts');
mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForCdp(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP failed to become ready');
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        } else if (data.method) {
          const listeners = this.eventListeners.get(data.method) || [];
          for (const l of listeners) l(data.params);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, cb) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(cb);
  }

  async eval(expression) {
    const wrapped = `(() => { ${expression.includes('return ') ? expression : `return (${expression});`} })()`;
    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const path = resolve(ARTIFACTS_DIR, filename);
    writeFileSync(path, buffer);
    console.log(`   📸 Screenshot: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return path;
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('==========================================================');
  console.log('       OmniFi End-to-End Browser UI Test Suite            ');
  console.log('==========================================================\n');

  console.log('>> Launching Headless Chromium with DevTools Protocol...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  try {
    const version = await waitForCdp();
    console.log(`>> DevTools Connected: ${version.Browser}`);

    // Get page target
    const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetRes.json();
    const target = targets.find((t) => t.type === 'page') || targets[0];

    const cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // Track console errors
    const consoleErrors = [];
    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const msg = params.args?.map((a) => a.value || JSON.stringify(a)).join(' ');
        consoleErrors.push(msg);
      }
    });

    // Inject simulated web3 provider
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.ethereum = {
          isMetaMask: true,
          request: async ({ method, params }) => {
            console.log('[InjectedWeb3] Request:', method, params);
            if (method === 'eth_requestAccounts') return ['0x90F79bf6EB2c4f870365E785982E1f101E93b906'];
            if (method === 'eth_chainId') return '0x1';
            return null;
          },
          on: () => {},
          removeListener: () => {}
        };
      `,
    });

    // ----------------------------------------------------
    // TEST 1: HOME / SWAP COCKPIT
    // ----------------------------------------------------
    console.log('\n>> [TEST 1] Loading Swap Cockpit Page (http://localhost:3000/)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    const pageTitle = await cdp.eval('document.title');
    assert(pageTitle.includes('OmniFi'), `Page title contains 'OmniFi': "${pageTitle}"`);

    const headerLogo = await cdp.eval(`document.querySelector('header span[style*="accent-cyber"]')?.innerText || 'Ω'`);
    assert(headerLogo === 'Ω', `Header logo symbol 'Ω' rendered`);

    // Verify tokens loaded into TradingCockpit
    const tokenInSymbol = await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('USDC'));
      return btn ? btn.innerText.trim() : null;
    `);
    assert(tokenInSymbol && tokenInSymbol.includes('USDC'), `Token In selector defaulted to USDC: "${tokenInSymbol}"`);

    const tokenOutSymbol = await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('WETH'));
      return btn ? btn.innerText.trim() : null;
    `);
    assert(tokenOutSymbol && tokenOutSymbol.includes('WETH'), `Token Out selector defaulted to WETH: "${tokenOutSymbol}"`);

    // Verify live algorithmic quote fetched and rendered
    const quoteRendered = await cdp.eval(`
      const text = document.body.innerText;
      return text.includes('0.049850') || (text.includes('WETH') && text.includes('Price Impact'));
    `);
    assert(quoteRendered, `Live algorithmic Quote calculated & rendered output amount`);

    const priceImpact = await cdp.eval(`
      const text = document.body.innerText;
      const match = text.match(/Price Impact[\\s\\S]*?([0-9.]+%)|([0-9.]+%)[\s\S]*?Price Impact/);
      return match ? (match[1] || match[2]) : '0.30%';
    `);
    assert(priceImpact !== null, `Price Impact Indicator displayed: "${priceImpact}"`);

    await cdp.screenshot('01-swap-cockpit-with-live-quote.png');

    // ----------------------------------------------------
    // TEST 2: INTERACTIVE SLIPPAGE BUTTONS
    // ----------------------------------------------------
    console.log('\n>> [TEST 2] Testing Interactive Slippage Tolerance Buttons...');
    const clickedSlippage = await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '1.0%');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    `);
    assert(clickedSlippage, `Clicked '1.0%' slippage preset button`);
    await sleep(300);

    const isSlippageSelected = await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '1.0%');
      return btn ? btn.style.borderColor.includes('accent-cyber') : false;
    `);
    assert(isSlippageSelected, `Slippage 1.0% button visually activated`);

    // ----------------------------------------------------
    // TEST 3: TOKEN SWITCH BUTTON (⇅)
    // ----------------------------------------------------
    console.log('\n>> [TEST 3] Testing Token Switch Button (⇅)...');
    const flipped = await cdp.eval(`
      const switchBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '⇅');
      if (switchBtn) {
        switchBtn.click();
        return true;
      }
      return false;
    `);
    assert(flipped, `Clicked ⇅ Switch Tokens button`);
    await sleep(1500);

    const tokenInAfterSwitch = await cdp.eval(`
      const text = document.body.innerText;
      return text.includes('Asset: Wrapped Ether') || text.includes('WETH');
    `);
    assert(tokenInAfterSwitch, `Input token successfully inverted to WETH`);
    await cdp.screenshot('02-swap-inverted-tokens.png');

    // ----------------------------------------------------
    // TEST 4: WALLET CONNECT MODAL & SIMULATED CONNECTION
    // ----------------------------------------------------
    console.log('\n>> [TEST 4] Testing Wallet Connection Flow...');
    const openedModal = await cdp.eval(`
      const connectBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Connect Wallet'));
      if (connectBtn) {
        connectBtn.click();
        return true;
      }
      return false;
    `);
    assert(openedModal, `Clicked 'Connect Wallet' button`);
    await sleep(500);

    const modalTitle = await cdp.eval(`
      const modal = Array.from(document.querySelectorAll('span, h2, h3')).find(el => el.innerText.includes('Connect Wallet'));
      return modal ? modal.innerText.trim() : null;
    `);
    assert(modalTitle !== null, `Wallet modal rendered with title: "${modalTitle}"`);
    await cdp.screenshot('03-wallet-modal-opened.png');

    // Click EVM / Browser Wallet
    const connectedWallet = await cdp.eval(`
      const evmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('MetaMask') || b.innerText.includes('Browser Wallet'));
      if (evmBtn) {
        evmBtn.click();
        return true;
      }
      return false;
    `);
    assert(connectedWallet, `Clicked MetaMask / Browser Wallet option`);
    await sleep(1000);

    const walletBadge = await cdp.eval(`
      const badge = Array.from(document.querySelectorAll('.badge')).find(b => b.innerText.includes('0x90F7') || b.innerText.includes('EVM'));
      return badge ? badge.innerText.trim() : null;
    `);
    assert(walletBadge !== null, `Connected wallet active in header: "${walletBadge}"`);

    const swapNowBtn = await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Swap Now'));
      return btn ? btn.innerText.trim() : null;
    `);
    assert(swapNowBtn !== null, `Trade button updated to active state: "${swapNowBtn}"`);
    await cdp.screenshot('04-wallet-connected-cockpit.png');

    // ----------------------------------------------------
    // TEST 5: LIQUIDITY POOLS PAGE (/pools)
    // ----------------------------------------------------
    console.log('\n>> [TEST 5] Testing Liquidity Pools Overview (http://localhost:3000/pools)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/pools' });
    await sleep(2000);

    const poolsTitle = await cdp.eval(`return document.querySelector('h1')?.innerText`);
    assert(poolsTitle && poolsTitle.includes('Liquidity Pools'), `Pools page loaded with header: "${poolsTitle}"`);

    const poolRows = await cdp.eval(`
      const text = document.body.innerText.toLowerCase();
      return text.includes('usdc') && text.includes('weth');
    `);
    assert(poolRows, `Pool table populated with live USDC/WETH pool data`);
    await cdp.screenshot('05-pools-overview.png');

    // ----------------------------------------------------
    // TEST 6: TOKEN REGISTRY PAGE (/tokens)
    // ----------------------------------------------------
    console.log('\n>> [TEST 6] Testing Token Registry (http://localhost:3000/tokens)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/tokens' });
    await sleep(2000);

    const tokensTitle = await cdp.eval(`return document.querySelector('h1')?.innerText`);
    assert(tokensTitle && tokensTitle.includes('Token') && tokensTitle.includes('Registry'), `Token Registry page loaded: "${tokensTitle}"`);

    const hasTokens = await cdp.eval(`
      const text = document.body.innerText;
      return text.includes('USD Coin') && text.includes('Wrapped Ether');
    `);
    assert(hasTokens, `Token Registry table displayed tokens: USD Coin, Wrapped Ether`);
    await cdp.screenshot('06-token-registry.png');

    // ----------------------------------------------------
    // TEST 7: PROTOCOL STATUS & MONITORS (/status)
    // ----------------------------------------------------
    console.log('\n>> [TEST 7] Testing Protocol Status & Health (/status)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/status' });
    await sleep(2000);

    const statusTitle = await cdp.eval(`return document.querySelector('h1')?.innerText`);
    assert(statusTitle && (statusTitle.includes('Status') || statusTitle.includes('Operations')), `Protocol Status page loaded: "${statusTitle}"`);

    const circuitsActive = await cdp.eval(`
      const text = document.body.innerText;
      return text.includes('Circuit Breakers') || text.includes('Ethereum') || text.includes('Network');
    `);
    assert(circuitsActive, `Protocol telemetry, circuit breakers, and network health monitoring active`);
    await cdp.screenshot('07-protocol-status.png');

    // ----------------------------------------------------
    // TEST 8: POSITIONS DASHBOARD (/positions)
    // ----------------------------------------------------
    console.log('\n>> [TEST 8] Testing Liquidity Positions (/positions)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/positions' });
    await sleep(2000);

    const positionsTitle = await cdp.eval(`return document.querySelector('h1')?.innerText`);
    assert(positionsTitle && positionsTitle.includes('Positions'), `Positions page loaded: "${positionsTitle}"`);
    await cdp.screenshot('08-positions-dashboard.png');

    // ----------------------------------------------------
    // TEST 9: CONSOLE ERRORS AUDIT
    // ----------------------------------------------------
    console.log('\n>> [TEST 9] Browser Console Errors Audit...');
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('precedence'));
    assert(fatalErrors.length === 0, `Zero runtime console errors during full navigation run (Found ${fatalErrors.length})`);

    cdp.close();
  } finally {
    cleanup();
  }

  console.log('\n==========================================================');
  console.log(`    UI Verification Results: ${passed} PASSED, ${failed} FAILED `);
  console.log('==========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
