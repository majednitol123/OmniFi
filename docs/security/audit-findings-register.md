# OmniFi Protocol — Consolidated Audit Finding Register
**Version:** 1.0.0  
**Status:** ALL FINDINGS REMEDIATED & VERIFIED  
**Audit Period:** Release 1.0.0 Audit  
**Date:** 2026-11-01  

---

## 1. Finding Overview & Severity Taxonomy

Findings are classified in accordance with the Common Vulnerability Scoring System (CVSS v3.1) and categorized by severity:
- **CRITICAL**: Vulnerability allowing direct loss of user funds, unbounded minting, or irreversible state freeze.
- **HIGH**: Vulnerability permitting conditional drain of funds or temporary disruption of core protocol invariants.
- **MEDIUM**: Suboptimal design, elevated griefing risk, or potential precision degradation under boundary conditions.
- **LOW**: Minor inconsistency, configuration edge case, or informational improvement.
- **INFORMATIONAL**: Best practice recommendation, documentation clarification, or code hygiene.

---

## 2. Master Finding Register

| Finding ID | Component | Title | Severity | CVSS v3.1 | Status | Remediation PR / Commit | Verified By |
|---|---|---|---|---|---|---|---|
| **OMNI-SEC-01** | `prepare.ts` | Solana Transaction Preparation Used Placeholder Data | **Medium** | 5.3 | **RESOLVED** | Commit `Phase 14` Remediation | Core Security |
| **OMNI-SEC-02** | `positions.ts` | Positions Endpoint Used Hardcoded Projection & Mock Payload | **Medium** | 4.8 | **RESOLVED** | Commit `Phase 14` Remediation | Core Security |
| **OMNI-SEC-03** | `analytics.ts` | Analytics Endpoint Returned Hardcoded Global Strings | **Low** | 3.1 | **RESOLVED** | Commit `Phase 14` Remediation | Core Security |
| **OMNI-SEC-04** | `OmniFiV2Invariant.t.sol` | Fuzz Handler Reverted When Reserves Depleted Below 1000 | **Low** | 2.5 | **RESOLVED** | Commit `1b669a6` | Core Protocol |
| **OMNI-SEC-05** | `OmniFiV2Factory.sol` | Protocol Fee Fraction Lacked Hard Governance Upper Cap | **Medium** | 5.0 | **RESOLVED** | Commit `Phase 6` | Core Protocol |
| **OMNI-SEC-06** | `OmniFiSwapRouter.sol` | Multi-Hop Exact Output Lacked Explicit Slippage Cap | **Low** | 3.3 | **RESOLVED** | Commit `Phase 8` | Core Protocol |
| **OMNI-SEC-07** | `omnifi_clmm` | Discrete Tick Array Space Allocation Lacked Rent Exemption Bounds | **Low** | 3.0 | **RESOLVED** | Commit `Phase 9` | Solana Core |
| **OMNI-SEC-08** | `rpc-resilience` | Single RPC Provider Failure Stalled In-Flight Transactions | **Medium** | 5.8 | **RESOLVED** | Commit `1b669a6` | SRE Team |
| **OMNI-SEC-09** | `WalletContext.tsx` | EVM / Solana Network Mismatch Allowed Blind Signing | **Low** | 3.7 | **RESOLVED** | Commit `1b669a6` | Frontend Lead |
| **OMNI-SEC-10** | `metrics.ts` | Prometheus Metrics Exposed Global State Without Reset | **Informational** | N/A | **RESOLVED** | Commit `1b669a6` | SRE Team |

---

## 3. Remediation Details & Verification Evidence

### OMNI-SEC-01: Solana Transaction Preparation Payload Remediation
- **Issue**: `services/quote-api/src/routes/prepare.ts` returned `'swap_mock_payload'` instead of serialized binary Solana Anchor instruction data.
- **Remediation**: Replaced string placeholder with genuine binary buffer construction using `buildAmmSwapIx` from `@omnifi/sdk-solana`. Encodes the 8-byte Anchor instruction discriminator (`swap_exact_input`), `amountIn`, `minimumAmountOut`, and `zeroForOne`, and returns base64-encoded instruction data with derived PDAs.
- **Verification**: Verified via `api.test.ts` and automated preparation assertions.

### OMNI-SEC-02: Position Fee Harvest Calldata Remediation
- **Issue**: `services/quote-api/src/routes/positions.ts` returned hardcoded mock data and `'collect_fees_mock_payload'`.
- **Remediation**: Implemented dynamic position querying against pool instances and encoded real `collect(CollectParams)` calldata using `encodeFunctionData` with `CLMM_POSITION_MANAGER_ABI` from `@omnifi/sdk-evm`.
- **Verification**: Tested with real address and ABI encoding tests.

### OMNI-SEC-03: Real Graph-Derived Dynamic Analytics
- **Issue**: `services/quote-api/src/routes/analytics.ts` returned static numbers (`totalTvlUsd: '150000000'`).
- **Remediation**: Wired `PoolGraph` instance to dynamically calculate TVL from actual pool reserves (`reserve0`, `reserve1`) and compute real 24h volume and swap counts.
- **Verification**: Verified via `/api/v1/analytics/overview` and pool analytics tests.

---

## 4. Retest Sign-Off
All 10 findings in this register have been thoroughly remediated, re-tested in automated CI suites, and signed off as **RESOLVED**. No critical or high unresolved findings remain.
