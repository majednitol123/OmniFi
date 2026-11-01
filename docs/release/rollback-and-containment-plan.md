# OmniFi Protocol — Rollback, Containment & Quarantine Plan
**Document Version:** 1.0.0  
**Effective Release:** Release 1.0.0  
**Status:** APPROVED & TESTED  
**Date:** 2026-11-01  
**Classification:** Operational Security Runbook  

---

## 1. Purpose & Incident Escalation Levels

This plan defines the step-by-step containment, quarantine, and rollback mechanisms available to operators in the event of smart contract vulnerabilities, severe market volatility, oracle failure, or infrastructure degradation.

OmniFi implements a **4-tier layered containment strategy** designed to minimize blast radius and protect user collateral while preserving decentralized trust:

```
+-----------------------------------------------------------------------------------------+
|                               FOUR-TIER CONTAINMENT TAXONOMY                            |
+-----------------------------------------------------------------------------------------+
| Level 1: UI / Client Quarantine     --> Hide affected pools / show warning banners      |
| Level 2: API & Routing Circuit Trip --> Reject trade route preparation in Quote API     |
| Level 3: On-Chain Emergency Pause   --> Multisig sentinel pauses pair swaps (RB-001)   |
| Level 4: Timelocked Upgrade/Rollback--> 24-hour Timelock execution of upgraded bytecode |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Containment Levels & Execution Procedures

### 2.1 Level 1: Client-Side UI Pool Quarantine (Response Time: < 5 Minutes)
- **Trigger:** Suspicious token activity, abnormal token transfer fees, or community alert on specific pair.
- **Action:**
  1. Update `deployments/production/feature-flags.json`:
     ```json
     "quarantinedPools": ["0xPoolAddress..."]
     ```
  2. The frontend dynamic pool discovery filters out the pool from default views and displays an orange `QUARANTINED` badge with trading disabled.
- **Impact:** Prevents standard retail users from interacting via the web interface. Does not halt on-chain liquidity or direct smart contract calls.

### 2.2 Level 2: Backend API & Route Traversal Circuit Breaker (Response Time: < 2 Minutes)
- **Trigger:** Oracle divergence $> 3\%$, price impact $> 15\%$, or repeated simulation reverts.
- **Action:**
  1. The Quote Engine Dijkstra route graph dynamically prunes edges with zero or negative liquidity or tripped circuit breakers.
  2. The `/api/v1/prepare` endpoint immediately returns an RFC 7807 `409 Conflict` error:
     ```json
     {
       "type": "https://errors.omnifi.exchange/pool-quarantined",
       "title": "Pool Quarantined",
       "status": 409,
       "detail": "Trading in this pool is temporarily suspended due to volatility guardrails."
     }
     ```
- **Impact:** Halts unsigned transaction generation for all SDK, API, and frontend consumers.

### 2.3 Level 3: On-Chain Emergency Pause via Multi-Sig Sentinel (Response Time: < 15 Minutes)
- **Trigger:** Confirmed smart contract vulnerability, reentrancy attempt, or unpegging exploit.
- **Action:**
  1. Follow Runbook `docs/runbooks/RB-001-emergency-pause.md`.
  2. On EVM: Emergency sentinel (`0x5afe...0002`) broadcasts `pause()` to the affected `OmniFiPool` or `OmniFiPoolManager`:
     ```bash
     cast send $POOL_ADDRESS "pause()" --rpc-url $ETH_RPC --private-key $SENTINEL_KEY
     ```
  3. On Solana: Squads multisig broadcasts `pause_pool` instruction to `omnifi_amm` or `omnifi_clmm`.
- **Impact:** Atomic on-chain halt of all swaps and liquidity deposits for the affected contract. Liquidity withdrawals (`remove_liquidity` / `burn`) remain active wherever safe to allow user asset recovery.

### 2.4 Level 4: Contract / Program Upgrade via Timelock (Response Time: 24+ Hours)
- **Trigger:** Remediated smart contract bug requiring replacement logic.
- **Action:**
  1. Build and verify new bytecode using deterministic build container (`coralxyz/anchor` or Foundry `cancun`).
  2. Queue upgraded implementation contract in `TimelockController` (`0x713e...0001` or Squads Timelock).
  3. Wait mandatory 86,400-second (24-hour) governance review period.
  4. Execute upgrade transaction after multi-sig sign-off.
- **Impact:** Protocol resumes normal operation with remediated contract logic.

---

## 3. Communication Protocols & Stakeholder Notifications

During any Level 2, 3, or 4 incident:
1. **Status Page:** Update `https://status.omnifi.exchange` within 10 minutes of initial containment.
2. **Social & Discord:** Publish standardized incident notification to official communication channels:
   > *"OmniFi security sentinels have placed pool [PAIR] into precautionary pause mode due to observed anomaly. All user collateral is secure. Updates will follow within 30 minutes."*
3. **Post-Mortem Policy:** Publish a comprehensive technical post-mortem within 72 hours of complete resolution, detailing root cause, timeline, impact, and preventive measures.

---

## 4. Rollback Plan Verification

This containment and rollback plan has been verified via chaos engineering rehearsals (`scripts/chaos-rehearsal.sh`) and simulated multisig pause drills (`test/v2/OmniFiV2Pair.t.sol`).
