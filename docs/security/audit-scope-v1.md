# OmniFi Protocol — Audit Scope & Formal Code Freeze Specification
**Document Version:** 1.0.0  
**Audit Target:** Release 1.0.0 Core Protocol  
**Date:** 2026-11-01  
**Classification:** Confidential / Security Auditor Baseline  
**Pinned Git Commit:** `1b669a6f744e32a4a4522054604561a3456cf175`  

---

## 1. Executive Summary & Audit Mandate

This document establishes the authoritative code freeze, repository boundary, and multi-chain threat surface definition for the independent security audit of the OmniFi Decentralized Exchange (DEX). 

OmniFi provides non-custodial decentralized exchange functionality across Ethereum Mainnet (`eip155:1`), Base (`eip155:8453`), and Solana (`solana:mainnet-beta`). The protocol implements both constant-product AMM mechanics and concentrated-liquidity market maker (CLMM) math, decoupled transaction preparation, and reorg-resilient off-chain data services.

No smart contract, program, or routing logic may be altered within the frozen tree hashes without an official, tracked audit addendum and security team sign-off.

---

## 2. Pinned Cryptographic Tree Hashes (Code Freeze)

The audit evaluates the repository in strict accordance with the following Git tree hashes at commit `1b669a6f744e32a4a4522054604561a3456cf175`:

| Scope Boundary | Subdirectory Path | Git Tree Hash | Lines of Code (SLoC) |
|---|---|---|---|
| **EVM Smart Contracts** | `chains/evm/src/` | `42fce1337ab5d6ffefedad4027b7a9bb88be0d9b` | ~2,850 Solidity |
| **Solana Anchor Programs** | `chains/solana/programs/` | `d7a9bd8bf7f75a92690901e369101155327f17d2` | ~2,100 Rust |
| **Core Libraries & SDKs** | `packages/` | `26ed17038164e485d89ba0e5771d3672221df11a` | ~5,400 TypeScript |
| **Backend Daemons & Indexers** | `services/` | `e7b2a0242d358a45dccfd3ffbbe54b581bc02de8` | ~3,200 TypeScript |
| **Frontend Application** | `apps/web/` | `05e1975e119ff31adcf64219fb5431835ca8c21a` | ~2,600 TypeScript / TSX |

---

## 3. In-Scope Components & Source Manifest

### 3.1 EVM Smart Contracts (`chains/evm/src/`)
1. **Constant Product V2 Core (`v2/`)**:
   - `OmniFiV2Factory.sol`: Deterministic pair deployment via `CREATE2`, protocol fee fraction governance, pair indexing.
   - `OmniFiV2Pair.sol`: Invariant enforcement ($k \ge r_0 \cdot r_1$), cumulative price oracles (TWAP), flash-mint protections, protocol fee distribution.
   - `libraries/OmniFiV2Library.sol`: Reentrancy-safe routing math, `getAmountOut`, `getAmountIn`, square-root reserves.
2. **Concentrated Liquidity CLMM Core (`clmm/`)**:
   - `OmniFiPoolFactory.sol`: Dynamic pool deployment, fee tier authorization (500, 3000, 10000 bps), tick spacing mapping.
   - `OmniFiPool.sol`: Virtual reserve math, discrete tick crossing, position tracking, protocol fee extraction.
   - `OmniFiSwapRouter.sol`: Single-hop and multi-hop exact-input and exact-output trade routing with slippage protection.
   - `libraries/SqrtPriceMath.sol`, `TickMath.sol`, `FullMath.sol`, `TickBitmap.sol`: Fixed-point Q64.96 arithmetic, phantom overflow prevention.
3. **Singleton Pool Manager (`v4/`)**:
   - `OmniFiPoolManager.sol`: Centralized liquidity singleton, transient flash accounting delta settling, hook authorization.

### 3.2 Solana Programs (`chains/solana/programs/`)
1. **Constant Product AMM (`omnifi_amm/`)**:
   - `src/lib.rs`: Pool state initialization, PDA authority derivation, swap exact input/output, LP deposit/withdrawal.
   - Fixed-point u128 arithmetic, constant product conservation, protocol fee truncation.
2. **Concentrated Liquidity CLMM (`omnifi_clmm/`)**:
   - `src/lib.rs`: Discrete tick array indexing, bitmap traversal, position minting, fee growth outside tracking.
   - `src/math/*`: `tick_math.rs`, `sqrt_price_math.rs`, `full_math.rs`.

### 3.3 Core Off-Chain Packages (`packages/`)
- `@omnifi/domain`: Canonical asset identifiers (CAIP-19), amount typing, error taxonomy.
- `@omnifi/quote-engine`: Dijkstra multi-hop route discovery, split-routing math, execution price simulation.
- `@omnifi/rpc-resilience`: Circuit breaker state machine, exponential backoff with jitter, automated endpoint failover.
- `@omnifi/sdk-evm`, `@omnifi/sdk-solana`, `@omnifi/sdk-unified`: Decoupled transaction serialization and unsigned payload construction.

---

## 4. Out-of-Scope Boundaries

The following components are explicitly outside the core protocol audit boundary:
1. **External ERC20 / SPL Token Contracts**: Non-standard tokens (e.g. rebasing tokens, fee-on-transfer tokens, pausable/blacklisting tokens) are handled via explicit exclusion or verified risk tiers.
2. **Third-Party RPC Node Infrastructure**: Alchemy, Infura, QuickNode, and Helius node internal consensus mechanisms are untrusted external networks mitigated by `@omnifi/rpc-resilience`.
3. **Browser Wallet Extensions**: MetaMask, Phantom, and Solflare client-side key generation and signature displays.
4. **Third-Party Cloud Providers**: AWS, Cloudflare, and Docker host operating systems.

---

## 5. Security Model & Primary Threat Vectors

Auditors must specifically evaluate the protocol against the following threat vectors:

1. **Economic Invariant Violations**:
   - Any sequence of deposits, swaps, or fee claims that causes pool reserves to decrease beyond the mathematical invariant.
   - Dust round-trip arbitrage draining token balances over repeated cycles.
2. **Flash Accounting Delta Non-Settlement (V4 Singleton)**:
   - Any exploit path allowing a caller to take transient token balances without settling all negative deltas before transaction completion.
3. **Cross-Program Invocation (CPI) & PDA Spoofing (Solana)**:
   - Supplying forged account PDAs, unverified vault tokens, or unverified mint accounts to AMM/CLMM instructions.
   - Bypassing signer or writable account verification.
4. **Frontrunning & Sandwich Attacks**:
   - Manipulation of transaction ordering to extract value when users trade with wide slippage limits.
5. **Reentrancy & Callback Vulnerabilities**:
   - External calls during ERC20 transfers (e.g. ERC777 tokens or hook callbacks) attempting to re-enter pools before state update.
6. **Key Custody & Signature Forgery**:
   - Ensuring backend APIs NEVER accept, store, or sign with user private keys (ADR-011).

---

## 6. Build & Toolchain Specifications

To ensure exact cryptographic reproducibility, builds must use:
- **EVM Compiler**: Solidity `0.8.26`, Optimizer: `true` (200 runs), EVM Version: `cancun`.
- **Foundry Framework**: `forge 0.2.0` (commit `latest`).
- **Rust Toolchain**: `rustc 1.79.0+`, Anchor CLI: `0.30.1`, Solana CLI: `1.18.26`.
- **Node & Package Manager**: Node.js `v20.x`, PNPM `v9.15.4`.
