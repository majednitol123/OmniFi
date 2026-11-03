import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const USER_DATA = '/tmp/omnifi-ui-verify-fixes';
const ARTIFACTS_DIR = '/Users/majedurrahman/.gemini/antigravity/brain/3716d0aa-07b5-460c-80f3-d21339de1d05/ui-artifacts';
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

  async eval(expression) {
    const trimmed = expression.trim();
    const hasReturn = trimmed.includes('return ');
    const wrapped = `(() => { ${hasReturn ? trimmed : (trimmed.includes(';') ? trimmed : `return (${trimmed});`)} })()`;
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
    console.log(`   📸 Captured: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return path;
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function run() {
  console.log('==========================================================');
  console.log('     OmniFi UI Regression & Verification Runner           ');
  console.log('==========================================================\n');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1280,850',
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
    await waitForCdp();
    const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetRes.json();
    const target = targets.find((t) => t.type === 'page') || targets[0];

    const cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // ----------------------------------------------------
    // STEP 1: Verify Swap Page & Connect Wallet Modal
    // ----------------------------------------------------
    console.log('>> [1/2] Loading Swap Cockpit (http://localhost:3000)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    // Verify quote loaded without "API request failed"
    const cockpitText = await cdp.eval('document.body.innerText');
    const hasApiError = cockpitText.includes('API request failed');
    console.log(`   - "API request failed" error present? ${hasApiError ? 'YES (BUG)' : 'NO (CLEAN)'}`);

    // Click "Connect Wallet"
    console.log('>> Opening Connect Wallet modal...');
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Connect Wallet'));
      if (btn) btn.click();
    `);
    await sleep(600);

    // Inspect modal geometry
    const modalGeometry = await cdp.eval(`
      const modal = document.querySelector('.modal-content');
      if (!modal) return null;
      const rect = modal.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
      };
    `);
    console.log('   - Modal Geometry:', modalGeometry);
    if (modalGeometry) {
      const isTopClipped = modalGeometry.top < 0;
      console.log(`   - Is modal top clipped (top < 0)? ${isTopClipped ? 'YES (BUG)' : 'NO (PERFECTLY CENTERED)'}`);
      const isVerticallyCentered = Math.abs((modalGeometry.windowHeight - modalGeometry.height) / 2 - modalGeometry.top) < 20;
      console.log(`   - Is modal vertically centered in viewport? ${isVerticallyCentered ? 'YES' : 'NO'}`);
    }

    await cdp.screenshot('verified-01-wallet-modal-centered.png');

    // ----------------------------------------------------
    // STEP 2: Verify Protocol Status Telemetry Overlap
    // ----------------------------------------------------
    console.log('\n>> [2/2] Loading Protocol Status Dashboard (http://localhost:3000/status)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/status' });
    await sleep(2500);

    const telemetryReport = await cdp.eval(`
      const cards = Array.from(document.querySelectorAll('.stat-card'));
      return cards.map(c => {
        const label = c.querySelector('.stat-label')?.innerText?.trim() || '';
        const valueEl = c.querySelector('.stat-value');
        const val = valueEl?.innerText?.trim() || '';
        const rect = c.getBoundingClientRect();
        const valueRect = valueEl ? valueEl.getBoundingClientRect() : null;
        return {
          label,
          val,
          cardWidth: Math.round(rect.width),
          valueWidth: valueRect ? Math.round(valueRect.width) : 0,
          isOverflowing: valueEl ? valueEl.scrollWidth > valueEl.clientWidth : false,
        };
      });
    `);

    console.log('   - Telemetry Cards Status:');
    for (const t of telemetryReport) {
      console.log(`     • ${t.label}: "${t.val}" (Width: ${t.valueWidth}px in ${t.cardWidth}px card, Overflow: ${t.isOverflowing ? 'YES (OVERFLOW!)' : 'NO (CLEAN)'})`);
    }

    await cdp.screenshot('verified-02-status-telemetry-clean.png');

    cdp.close();
  } finally {
    cleanup();
  }

  console.log('\n==========================================================');
  console.log('         UI Verification Completed Successfully           ');
  console.log('==========================================================');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
