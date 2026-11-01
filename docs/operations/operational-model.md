# OmniFi — Operational Model

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-11-01  
**Source:** plan.md §35, §39, §60

---

## 1. Roles and Ownership

| Role | Responsibilities | Assignment |
|------|-----------------|------------|
| **Product Owner** | Scope, priorities, acceptance criteria, release authorization, ADR decisions | TBD |
| **Protocol Lead** | Architecture, math specifications, accounting specs, protocol review | TBD |
| **EVM Engineer** | Solidity contracts, Foundry tests, EVM security patterns | TBD |
| **Solana Engineer** | Rust/Anchor programs, account model design, Solana security | TBD |
| **Backend Engineer** | API, quote engine, indexers, database, workers | TBD |
| **Frontend Engineer** | Wallet flows, UX, React/Next.js, accessibility | TBD |
| **DevOps/SRE** | Infrastructure, observability, deployment, recovery procedures | TBD |
| **Security Reviewer** | Threat model, secure design review, audit coordination | TBD |

One person may cover multiple roles in a small team, but responsibilities must remain explicit. An autonomous agent may assist with implementation but must not be the sole approver of security-sensitive design or production release.

## 2. Key Management Policy

### 2.1 Role Separation (from ADR-011)

| Role | Signing Model | Threshold | Timelock |
|------|--------------|-----------|----------|
| Deployer | Multisig | 2-of-N | None |
| Protocol Admin | Multisig | 3-of-N | 48h for config changes |
| Guardian / Pause | Multisig | 1-of-N | None (emergency) |
| Fee Recipient | Multisig | 2-of-N | None |
| Upgrade Authority | Multisig | 3-of-N | 72h |
| Token Registry Operator | Multisig | 2-of-N | None |
| Monitoring Operator | Individual | Read-only | N/A |

### 2.2 Key Management Rules

- No shared personal keys
- No seed phrases in environment files, chat, or agent memory
- Production keys must be hardware-backed or in a managed signing service
- Key rotation procedures must be documented and tested
- Recovery procedures must be tested in non-production environment
- All role changes must be logged and trigger monitoring alerts

## 3. Pause Policy

### 3.1 Scope

Pause authority is **narrowly scoped per component**, not a global kill switch:

| Component | Pausable? | Authority | Scope |
|-----------|-----------|-----------|-------|
| EVM Pool (individual) | Yes | Guardian | Stops swaps/liquidity on one pool |
| EVM Factory | Yes | Guardian | Stops new pool creation |
| EVM Router | Yes | Guardian | Stops routed swaps |
| Solana Pool (individual) | Yes | Guardian | Stops instructions on one pool |
| Solana Global Config | Yes | Guardian | Stops new pool creation |
| API | Yes | DevOps/SRE | Returns 503 with reason |
| Frontend | Yes | DevOps/SRE | Maintenance mode |

### 3.2 Pause Types

- **Emergency pause:** Immediate, 1-of-N guardian threshold. Trigger: suspected exploit, unexpected balance change.
- **Planned pause:** Coordinated, 2-of-N threshold. Trigger: planned maintenance, upgrade deployment.

### 3.3 Resume Policy

- Resume requires 2-of-N threshold (higher than emergency pause)
- Post-incident review must be completed before resume
- Monitoring must confirm healthy state before resume

## 4. Monitoring Ownership

| Responsibility | Owner | Escalation |
|---------------|-------|------------|
| Infrastructure alerts | DevOps/SRE | → Protocol Lead if protocol-related |
| Protocol invariant alerts | Protocol Lead | → Security Reviewer |
| Security alerts | Security Reviewer | → Product Owner |
| On-call rotation | DevOps/SRE | Defined in incident response |

## 5. Change Management

All configuration changes follow this process:

1. **Propose:** Create ADR or change request with rationale
2. **Review:** Security reviewer approves security-sensitive changes
3. **Test:** Apply change in test environment first
4. **Apply:** Execute via multisig with appropriate threshold and timelock
5. **Monitor:** Verify change had intended effect
6. **Document:** Update operational docs and traceability matrix

