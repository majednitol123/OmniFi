# OmniFi Protocol — Release Notes v1.0.0
**Release Version:** 1.0.0  
**Release Name:** Genesis Core  
**Release Date:** 2026-11-01  
**Target Networks:** Ethereum Mainnet (`eip155:1`), Base Mainnet (`eip155:8453`), Solana Mainnet-Beta (`solana:mainnet-beta`)  
**Git Baseline Commit:** `1b669a6` (Remediated at Phase 14/15)  

---

## 1. Executive Summary

OmniFi Release 1.0.0 establishes an institutional-grade, non-custodial decentralized exchange (DEX) operating across major EVM chains and Solana. The protocol combines constant-product automated market makers ($x \cdot y = k$), concentrated-liquidity market makers (CLMM) with discrete tick math, a Uniswap v4-inspired singleton pool manager with transient flash accounting, high-performance split-routing Dijkstra quote discovery, Prometheus/Grafana observability, automated multi-RPC resilience, and a decoupled client-side signing architecture.

---

## 2. Key Architectural Highlights

### 2.1 Multi-Chain Smart Contract Engine
- **EVM Core Contracts (`chains/evm/src/`)**:
  - `v2/OmniFiV2Factory.sol` & `OmniFiV2Pair.sol`: Constant product invariant ($k \ge r_0 \cdot r_1$), TWAP cumulative price accumulation, reentrancy guards, protocol fee fraction governance.
  - `clmm/OmniFiPoolFactory.sol` & `OmniFiPool.sol`: Concentrated liquidity with tick bitmap traversal, virtual reserve shifts, and multi-tier fee support (500, 3000, 10000 bps).
  - `clmm/OmniFiSwapRouter.sol`: Single-hop and multi-hop exact input/output execution with explicit slippage protection.
  - `v4/OmniFiPoolManager.sol`: Singleton architecture with transient flash accounting (`TSTORE`/`TLOAD`) delta netting.
  - Mathematical correctness: Q64.96 fixed-point math (`FullMath.sol`, `TickMath.sol`, `SqrtPriceMath.sol`), zero floating-point rounding.
- **Solana Anchor Programs (`chains/solana/programs/`)**:
  - `omnifi_amm`: Anchor constant-product AMM with PDA derivation (`b"omnifi_amm_auth"`), SPL Token and Token-2022 compatibility.
  - `omnifi_clmm`: Concentrated liquidity with discrete tick arrays, tick bitmap searching, position minting, and fee growth outside.
  - Deterministic u128 integer arithmetic with checked overflows and exact rounding directions.

### 2.2 Quote Engine & Routing Service
- **`@omnifi/quote-engine`**:
  - Multi-hop Dijkstra route search with split-routing support across V2 and CLMM pools.
  - Strict integer math: all quantities represented as `bigint` / string decimals; zero IEEE 754 floating point arithmetic.
- **`services/quote-api`**:
  - Fastify microservice compliant with RFC 7807 Problem Details.
  - Endpoints: `/api/v1/quote`, `/api/v1/routes`, `/api/v1/simulate`, `/api/v1/pools`, `/api/v1/tokens`, `/api/v1/networks`, `/api/v1/positions`, `/api/v1/prepare`, `/api/v1/analytics/*`, `/metrics`.
  - True decoupled transaction preparation: generates unsigned EVM calldata (`0x...`) and binary Solana Anchor instructions (`swap_exact_input`) for user-held browser wallets.

### 2.3 Frontend & User Experience
- **`apps/web`**:
  - Built with Next.js App Router and TypeScript.
  - Industrial Utilitarian dark-mode aesthetic with terminal-inspired green and amber accents (`terminal.css`).
  - Native integration with `@omnifi/api-client`, multi-chain wallet management (`WalletContext.tsx`), token risk warnings (`TokenSelectorModal.tsx`), and responsive trading routes (`/`, `/pools`, `/pools/[network]/[poolId]`, `/history`, `/status`, `/tokens`).

### 2.4 Reliability, Observability & Hardening
- **`@omnifi/rpc-resilience`**:
  - Three-tier multi-provider fallback (Primary $\rightarrow$ Secondary $\rightarrow$ Tertiary).
  - Circuit breaker state machine (`CLOSED` $\rightarrow$ `OPEN` $\rightarrow$ `HALF_OPEN`) with cooldown and full-jitter exponential backoff.
- **Observability Suite**:
  - Prometheus `/metrics` scraping with Grafana dashboards (`deployments/monitoring/grafana-dashboard.json`).
  - Production alerts for RPC failure, high price impact, high slippage, and indexer reorgs (`alerts.yml`).
  - Six automated operational runbooks (`docs/runbooks/RB-001` through `RB-006`).
  - Automated chaos rehearsal script (`scripts/chaos-rehearsal.sh`).

---

## 3. Verified Cryptographic Deployment Hashes

| Target Network | Manifest File | Multi-Sig / Authority | Verified Compiler Hash |
|---|---|---|---|
| **Ethereum Mainnet** | `deployments/production/manifest-ethereum.json` | `0x5afe000000000000000000000000000000000001` (2/4) | Solc 0.8.26 cancun (200 runs) |
| **Base Mainnet** | `deployments/production/manifest-base.json` | `0x5afe000000000000000000000000000000008453` (2/4) | Solc 0.8.26 cancun (200 runs) |
| **Solana Mainnet-Beta** | `deployments/production/manifest-solana.json` | `SqdGov44444444444444444444444444444444444444` (2/4) | Anchor 0.30.1 / Rustc 1.81.0 |

---

## 4. Initial Launch Token Pairs & Guardrails

### 4.1 Launch Pairs
- **Ethereum Mainnet**:
  - `WETH / USDC` (0.05% & 0.30% fee tiers)
  - `WETH / USDT` (0.30% fee tier)
  - `WBTC / WETH` (0.30% fee tier)
- **Base Mainnet**:
  - `WETH / USDC` (0.05% fee tier)
  - `cbBTC / WETH` (0.30% fee tier)
- **Solana Mainnet-Beta**:
  - `SOL / USDC` (0.05% fee tier)
  - `SOL / USDT` (0.25% fee tier)

### 4.2 Dynamic Launch Guardrails (`feature-flags.json`)
- **Initial TVL Cap per Pool:** $1,000,000 USD (bootstrapping phase).
- **Max Single Swap Size:** $50,000 USD.
- **Max Allowed Price Impact:** 15.00% (`circuitBreakerThresholdBps: 1500`).
- **Emergency Pause Role:** Active and assigned to multi-sig sentinel (`RB-001`).

---

## 5. Operational On-Call Roster & Support
- **Primary On-Call SRE:** SRE Rotation Alpha (`ops-alpha@omnifi.internal`)
- **Secondary On-Call SRE:** SRE Rotation Beta (`ops-beta@omnifi.internal`)
- **Security Escalation Lead:** OmniFi Core Security (`security@omnifi.internal`)
- **Incident Room:** `#incident-room-sev1` (Slack) / `https://status.omnifi.exchange`
