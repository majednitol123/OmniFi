# OmniFi — Incident Response Plan

**Version:** 1.0  
**Status:** Draft — runbook skeletons, to be expanded during Phase 13  
**Date:** 2026-11-01  
**Source:** plan.md §39

---

## General Incident Framework

Every incident follows: **Detect → Assess → Contain → Communicate → Investigate → Recover → Review**

---

## Runbook 1: Suspected Contract/Program Exploit

**Detection Signals:** Unexpected vault balance decrease, reconciliation mismatch alert, community report, unusual swap patterns  
**Decision Owner:** Protocol Lead + Security Reviewer  
**Containment:**
- Guardian exercises emergency pause on affected pool(s)
- If scope unclear, pause factory and router
- Do NOT attempt to "fix" on-chain — preserve state for analysis

**Pause Decision:** Yes — immediate emergency pause (1-of-N)  
**Communication:** Notify team immediately. Public status page update within 30 min.  
**Evidence Preservation:** Record block number/slot, transaction hashes, vault balances, pool state snapshots. Do not modify on-chain state.  
**Recovery:** Fix requires: root cause analysis → patch → test environment validation → security review → re-audit if material → resume with 2-of-N  
**Post-Incident Review:** Mandatory. Document root cause, timeline, impact, remediation, and prevention measures.

---

## Runbook 2: Unexpected Vault Balance Movement

**Detection Signals:** Reconciliation worker alert, vault balance diverges from accounting  
**Decision Owner:** Protocol Lead  
**Containment:** Pause affected pool. Compare on-chain vault balance with indexed accounting.  
**Investigation:** Is it a legitimate operation (large swap, liquidity event) or unauthorized? Check recent transactions against pool events.  
**Recovery:** If legitimate: update reconciliation thresholds. If unauthorized: escalate to Runbook 1.

---

## Runbook 3: Malicious Token or Hook

**Detection Signals:** Token exhibits unexpected transfer behavior (fee-on-transfer not declared, revert on transfer, callback execution), user reports  
**Decision Owner:** Token Registry Operator + Security Reviewer  
**Containment:** Add token to blocklist. Update token risk label. If pool is affected, consider pause.  
**Communication:** Display warning in frontend for affected pools.  
**Recovery:** Update token compatibility policy. Review detection mechanisms.

---

## Runbook 4: Admin Key Compromise

**Detection Signals:** Unauthorized role change, unexpected config update, multisig signer reports compromise  
**Decision Owner:** Product Owner + Security Reviewer  
**Containment:**
- Immediately rotate compromised key from multisig
- If threshold is compromised, emergency pause ALL protocol components
- Revoke compromised signer from all multisig wallets

**Communication:** Internal team alert immediately. Public disclosure per responsible disclosure policy.  
**Recovery:** New signer onboarding. Security audit of all changes made by compromised key. Consider full redeployment if admin had upgrade authority.

---

## Runbook 5: RPC Provider Compromise or Outage

**Detection Signals:** RPC health check failures, stale block/slot numbers, inconsistent responses between providers  
**Decision Owner:** DevOps/SRE  
**Containment:** Circuit breaker activates automatic failover to backup provider. Mark unhealthy provider as disabled.  
**Communication:** Internal alert. If user-facing impact, update status page.  
**Recovery:** Verify data consistency after provider recovery. Reconcile any indexer gaps.

---

## Runbook 6: Indexer Corruption or Lag

**Detection Signals:** Indexer lag exceeds SLO threshold, reconciliation mismatches, missing events detected  
**Decision Owner:** Backend Engineer  
**Containment:** If lag is critical (>5 min), display staleness warning in frontend. If corruption detected, halt indexer.  
**Recovery:** Rebuild from last known-good checkpoint. Backfill missing events. Reconcile against on-chain state.  
**Note:** Indexed data is a projection (§27.5), not protocol truth. On-chain state is canonical.

---

## Runbook 7: Frontend Compromise

**Detection Signals:** User reports suspicious behavior, CSP violation alerts, dependency audit alerts, unexpected build artifact hashes  
**Decision Owner:** Frontend Engineer + Security Reviewer  
**Containment:** Take frontend offline immediately (maintenance mode). Revert to last known-good deployment.  
**Communication:** Public alert: "Do not interact with the frontend until further notice."  
**Recovery:** Audit all dependencies. Verify build reproducibility. Redeploy from verified source. Post-mortem on supply chain.

---

## Runbook 8: Database Loss

**Detection Signals:** Database connection failures, data query errors, backup verification failures  
**Decision Owner:** DevOps/SRE + Backend Engineer  
**Containment:** Activate read-replica if available. Display degraded-service notice.  
**Recovery:** Restore from latest backup. Verify data integrity. Re-index from chain checkpoints if needed.  
**Note:** Database is a projection — can be fully reconstructed from chain events, but rebuild takes time.

---

## Runbook 9: Deployment Error

**Detection Signals:** Health checks fail after deployment, unexpected contract/program behavior, wrong constructor args  
**Decision Owner:** Protocol Lead + DevOps/SRE  
**Containment:** If on-chain: do NOT interact with misdeployed contracts. If off-chain: rollback to previous version.  
**Recovery:** Analyze deployment scripts. Fix and redeploy to test environment. Verify before retrying.  
**Note:** On-chain deployments may be irreversible depending on upgradeability policy (ADR-010).

---

## Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 — Critical** | Active fund loss or imminent risk | Immediate (< 15 min) | Exploit, key compromise |
| **P1 — High** | Service outage or data corruption | < 30 min | API down, indexer corruption |
| **P2 — Medium** | Degraded service | < 2 hours | Slow quotes, stale data |
| **P3 — Low** | Minor issue, no user impact | < 24 hours | UI bug, non-critical alert |

