# OmniFi — Delivery Plan

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-11-01  
**Source:** plan.md §40-56, §60

---

## 1. Phase Overview

| Phase | Name | Est. Duration | Dependencies | Key Deliverables |
|-------|------|--------------|-------------|------------------|
| **0** | Product Discovery | 2-3 weeks | — | PRD, ADRs, threat model v1, economic spec |
| **1** | Protocol Math & Specs | 3-4 weeks | Phase 0 | Math specs, reference models, test vectors |
| **2** | Repo & CI Foundation | 1-2 weeks | Phase 0 | Toolchains, CI/CD, linting, local dev env |
| **3** | Domain, Registry, Tokens | 1-2 weeks | Phase 2 | Types, network registry, token policy impl |
| **4** | EVM V2 Reference AMM | 2-3 weeks | Phase 1, 3 | Factory, pool, router (if ADR-002 = yes) |
| **5** | EVM CLMM | 4-6 weeks | Phase 1, 3 | Tick math, positions, swap, fee growth |
| **6** | EVM v4 Singleton | Deferred | — | Per ADR-004 recommendation |
| **7** | Solana AMM | 3-4 weeks | Phase 1, 3 | Programs, PDAs, vaults |
| **8** | Solana CLMM | 4-6 weeks | Phase 1, 7 | Tick arrays, positions, compute optimization |
| **9** | Router & Quotes | 2-3 weeks | Phase 4-8 | Route search, simulation, slippage |
| **10** | SDK & API | 2-3 weeks | Phase 9 | EVM/Solana/Unified SDKs, OpenAPI |
| **11** | Indexers & Data | 3-4 weeks | Phase 4-8 | Indexers, DB, reconciliation |
| **12** | Frontend | 3-4 weeks | Phase 10, 11 | Full UI, wallet flows |
| **13** | Operations | 2-3 weeks | Phase 11, 12 | Monitoring, alerts, runbooks |
| **14** | Audit & Remediation | 4-8 weeks | Phase 5, 7, 8 | External audits, fix & re-test |
| **15** | Controlled Release | 1-2 weeks | Phase 13, 14 | Deployment, verification |

**Total estimated R1 timeline:** 6-9 months (with parallelization)

## 2. Parallelization Opportunities

```
Phase 0 ──→ Phase 1 ──┬──→ Phase 4 (EVM V2) ──┐
              │        ├──→ Phase 5 (EVM CLMM)──┤
              │        ├──→ Phase 7 (Sol AMM) ──┤──→ Phase 9 ──→ Phase 10 ──→ Phase 12
              │        └──→ Phase 8 (Sol CLMM)──┘       ↑          ↑
              │                                          │          │
              └──→ Phase 2 ──→ Phase 3 ────────────────→─┘          │
                                                                     │
                                              Phase 11 (Indexers) ──→┘
                                                    ↓
                                              Phase 13 (Ops)
                                                    ↓
                              Phase 14 (Audit) ──→ Phase 15 (Release)
```

Key parallelization:
- Phase 2 (CI) can run alongside Phase 1 (math specs)
- Phases 4, 5, 7, 8 can partially overlap with sufficient engineers
- Phase 11 (indexers) can start once any pool contract/program exists
- Phase 14 (audit) should start as soon as on-chain code freezes (Phase 5 + 8 complete)

## 3. Staffing Assumptions

| Role | Phases Involved | Full-Time Equivalent |
|------|----------------|---------------------|
| Protocol Lead | 0, 1, 5, 8, 9, 14 | 1.0 |
| EVM Engineer | 1, 2, 4, 5, 9 | 1.0 |
| Solana Engineer | 1, 7, 8, 9 | 1.0 |
| Backend Engineer | 2, 3, 9, 10, 11 | 1.0 |
| Frontend Engineer | 3, 10, 12 | 1.0 (start Phase 3) |
| DevOps/SRE | 2, 13, 15 | 0.5 (full-time in Phase 13-15) |
| Security Reviewer | 0, 1, 5, 8, 14 | 0.5 (full-time in Phase 14) |
| Product Owner | 0, 12, 15 | 0.25 (decision points) |

**Minimum team size for R1:** 4-5 engineers + 1 product owner + 1 security reviewer

## 4. Milestones

| Milestone | Gate | Target |
|-----------|------|--------|
| M0: Discovery complete | Phase 0 exit | Week 3 |
| M1: Specs complete | Phase 1 exit | Week 7 |
| M2: Infrastructure ready | Phase 2 + 3 exit | Week 8 |
| M3: EVM CLMM code complete | Phase 5 exit | Week 14 |
| M4: Solana CLMM code complete | Phase 8 exit | Week 16 |
| M5: Full stack integration | Phase 9 + 10 + 11 + 12 exit | Week 22 |
| M6: Audit started | Phase 14 entry | Week 18 (audit scope = Phase 5 + 8 code) |
| M7: Audit complete + remediated | Phase 14 exit | Week 26 |
| M8: Production release | Phase 15 exit | Week 28 |

## 5. Risk-Adjusted Timeline

| Risk | Impact on Timeline | Mitigation |
|------|-------------------|------------|
| ADR decisions delayed | +2-4 weeks | Pre-schedule review sessions |
| CLMM math specification takes longer | +2 weeks | Start reference model early |
| Audit availability | +2-6 weeks | Engage auditor early (during Phase 5) |
| Solana compute optimization iterations | +1-2 weeks | Budget extra time in Phase 8 |
| v4 singleton re-scoped into R1 | +4-6 weeks | Keep deferred per ADR-004 |

