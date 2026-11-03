# OmniFi — Release Policy

**Version:** 1.0  
**Status:** Approved — Protocol Engineering Release Policy v1.0  
**Date:** 2026-11-02  
**Source:** plan.md §36, §38

---

## Five-Gate Release Process

A release **cannot advance** unless all applicable gates pass. If any gate fails, the release is **blocked**.

### Gate A — Specification

| Criterion | Evidence |
|-----------|----------|
| Requirements approved | PRD sign-off |
| ADRs accepted | All relevant ADRs have `Accepted` status |
| Math and accounting specs reviewed | Protocol lead sign-off |
| Threat model reviewed | Security reviewer sign-off |

### Gate B — Engineering

| Criterion | Evidence |
|-----------|----------|
| Code review complete | All PRs approved |
| CI green | All pipelines pass |
| Unit/integration/invariant tests pass | Test output in CI artifacts |
| Static analysis reviewed | Slither/clippy reports clean or findings accepted |
| Reproducible build confirmed | Independent build produces same artifact hash |

### Gate C — Test Environment

| Criterion | Evidence |
|-----------|----------|
| Full end-to-end flows pass | E2E test results |
| Indexer reconciliation passes | Reconciliation worker report |
| RPC failure and recovery tests pass | Failover test results |
| Monitoring and runbooks verified | Ops team sign-off |

### Gate D — Security

| Criterion | Evidence |
|-----------|----------|
| Independent audits completed | Audit reports |
| Critical/high issues fixed and re-tested | Remediation PRs + re-test evidence |
| Economic risk review complete | Security reviewer sign-off |
| Key custody reviewed | Operational model verified |
| Residual risks documented and accepted | Risk register with owner acceptance |

### Gate E — Production Authorization

| Criterion | Evidence |
|-----------|----------|
| Deployment plan approved | Deployment manifest reviewed |
| Exact chain and addresses verified | Post-deployment verification script |
| Signers and roles verified | Multisig configuration confirmed |
| Monitoring/on-call active | Dashboard + alert verification |
| Incident and pause procedures rehearsed | Rehearsal log |
| **Explicit project-owner authorization** | Recorded decision |

---

## Environment Strategy

### Local Development

- Local EVM node (Anvil via Foundry)
- Local Solana validator (`solana-test-validator`)
- Deterministic fixtures and mock tokens
- Local PostgreSQL and Redis
- Reproducible setup scripts

### Testnet / Devnet

- Explicitly selected test networks (per ADR-001)
- Test tokens only — no real value
- Test deployment registry
- Monitoring enabled
- Full user journey tests
- **No real funds**

### Production

- Only after all 5 release gates pass
- Verified artifacts and deployment addresses
- Audited code hash matches deployed bytecode/program
- Operational on-call active
- Monitoring and incident response ready
- Controlled initial limits (pool creation, TVL caps if applicable)
- Public status page and documentation

---

## Release Artifacts

Every production release must produce:

| Artifact | Description |
|----------|-------------|
| Deployment manifest | Contract addresses / program IDs, versions, code hashes |
| Build reproduction script | Commands to reproduce exact build artifacts |
| Test evidence archive | All Gate B-C evidence |
| Audit reports | Gate D evidence |
| Release notes | Changes, known limitations, residual risks |
| Rollback plan | Steps to contain or roll back each component |

