# Security Audit Report: AR-003 Economic & Routing Exploit Resistance
**Scope:** `packages/quote-engine/`, `services/quote-api/`, On-Chain Routers  
**Evaluator:** Independent Protocol Security Review  
**Date:** 2026-11-01  
**Status:** COMPLETE — REMEDIATIONS VERIFIED  

---

## 1. Executive Summary
This audit evaluated the protocol's resistance against economic attacks, maximal extractable value (MEV) exploitation, sandwich attacks, routing graph manipulation, price impact exploitation, and fee-on-transfer discrepancies.

---

## 2. In-Depth Economic Analysis

### 2.1 Frontrunning & Sandwich Attack Mitigation
* **Vulnerability Context**:
  When users submit swaps without tight slippage limits, searchers can frontrun with a buy order and backrun with a sell order, extracting the user's slippage margin.
* **Protocol Safeguards**:
  1. **Strict On-Chain Enforcement**: Both EVM routers (`OmniFiSwapRouter.sol`, `OmniFiV2Router.sol`) and Solana AMM programs reject transactions where:
     $$\text{amountOutReceived} < \text{amountOutMinimum}$$
  2. **Frontend UI Defenses**: Default slippage tolerance is capped at 50 bps (0.50%). Swaps with price impact $>1.0\%$ trigger visual warnings, and price impact $>5.0\%$ imposes a hard confirmation barrier.

### 2.2 Routing Graph Cycles & Infinite Loops
* **Algorithm**:
  The off-chain routing engine implements Dijkstra's shortest-path algorithm across candidate pool nodes.
* **Guards**:
  - `maxHops` is strictly bounded to $\le 3$.
  - Visited node tracking prevents cyclic path loops.
  - Split routes are evaluated only across parallel orthogonal paths.

### 2.3 Non-Standard Token Handling
* **Fee-on-Transfer Tokens**:
  Standard pairs measure balance changes (`balanceAfter - balanceBefore`) rather than trusting parameter amounts, preventing insolvency when tokens deduct transfer fees.

---

## 3. Finding Summary Table

| Finding ID | Title | Severity | Status | Remediation Ref |
|---|---|---|---|---|
| ECO-01 | Slippage Default Safeguard | Low | Resolved | Default 50 bps with strict check |
| ECO-02 | Price Impact Warning Thresholds | Medium | Resolved | 100 bps warning / 500 bps barrier |
| ECO-03 | Dijkstra Route Traversal Depth Cap | Low | Resolved | Strictly bounded to 3 hops |

---

## 4. Auditor Conclusion
Economic security controls and slippage protections provide robust defense against sandwiching, MEV drain, and routing cycle exploits.
