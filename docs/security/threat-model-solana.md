# OmniFi — Solana Threat Model

**Version:** 1.1  
**Status:** Spec-Aligned — mitigations mapped to Phase 1 specifications  
**Date:** 2026-11-01  
**Source:** plan.md §28, §20-23  
**Spec References:** `solana-amm-spec.md`, `solana-clmm-spec.md`, `fee-and-rounding-spec.md`, `token-compatibility.md`

---

## 1. Assets to Protect

| Asset | Description | Criticality |
|-------|-------------|-------------|
| User token balances | SPL Token / Token-2022 accounts | Critical |
| Pool vault balances | Token accounts owned by pool authority PDA | Critical |
| LP positions | Position accounts (PDA-backed) | Critical |
| Protocol fee balances | Fee collection accounts | High |
| Program upgrade authority | Authority to modify deployed programs | Critical |
| PDA authority relationships | Vault authority, pool authority derivations | Critical |
| Token registry integrity | Verified token list | Medium |

## 2. Threat Actors

| Actor | Capability | Motivation |
|-------|-----------|------------|
| Malicious trader | Crafts instructions with substituted accounts | Financial gain |
| Malicious token issuer | Deploys deceptive mints with Token-2022 extensions | Rug pull |
| Malicious LP | Manipulates pool initialization | Extract value |
| MEV searcher | Reorders transactions in block | Sandwich, arbitrage |
| Compromised RPC provider | Returns false account/slot data | Data manipulation |
| Compromised upgrade authority | Can modify program code | Total compromise |

## 3. Solana-Specific Attack Vector Analysis

| # | Attack Vector | Severity | Likelihood | Affected Component | Mitigation Strategy | Status |
|---|--------------|----------|------------|-------------------|---------------------|--------|
| SOL1 | Account substitution / PDA validation failure | Critical | High | All Instructions | **Spec:** `solana-amm-spec.md` §5.1 universal PDA validation — re-derive every PDA on-chain and compare; `solana-clmm-spec.md` §13 security validation checklist | Spec Defined |
| SOL2 | CPI privilege escalation | Critical | Medium | Cross-Program Invocation | **Spec:** `solana-amm-spec.md` §1.4 pool authority PDA is signer-only; CPI seeds validated per §5.2 | Spec Defined |
| SOL3 | Account aliasing | High | Medium | Instructions with multiple accounts | **Spec:** `solana-amm-spec.md` §5.3 anti-aliasing checks — vault_0 ≠ vault_1, user_token_in ≠ vault_in, etc. | Spec Defined |
| SOL4 | Program upgrade authority compromise | Critical | Low | Program deployment | Multisig upgrade authority (ADR-011). Core contracts immutable after audit (ADR-010) | Spec Defined |
| SOL5 | Arithmetic overflow/underflow | Critical | Low | AMM/CLMM Math | **Spec:** `solana-clmm-spec.md` §1 Q32.64/Q64.64 u128 arithmetic; Rust checked_math. Reference model: `test-vectors/solana-clmm/reference_model.py` | Spec Defined |
| SOL6 | Rounding and dust extraction | High | Medium | Swap Math, Fees | **Spec:** `fee-and-rounding-spec.md` §4 master rounding table; `solana-amm-spec.md` §4.5 swap rounding (fee round UP, output round DOWN) | Spec Defined |
| SOL7 | Incorrect fee accounting | High | Medium | Pool Program | **Spec:** `solana-clmm-spec.md` §6 fee growth accounting (Q64.64); protocol fee per `fee-and-rounding-spec.md` §3. Reference models provide differential test baseline | Spec Defined |
| SOL8 | Pool initialization manipulation | High | Medium | Create Pool Instruction | **Spec:** `solana-amm-spec.md` §4.3 MINIMUM_LIQUIDITY=1000 burned; `solana-clmm-spec.md` §11.1 initial sqrt-price validation | Spec Defined |
| SOL9 | Token-2022 transfer-hook abuse | High | Medium | Router, Pool | **Spec:** `token-compatibility.md` — transfer-hook tokens BLOCKED in R1; validated at pool creation | Spec Defined |
| SOL10 | Token-2022 transfer-fee miscalculation | High | Medium | Quote Engine, Pool | **Spec:** `solana-amm-spec.md` §6.3 transfer-fee adjustment — actual_received = amount - extension_fee; `token-compatibility.md` conditional support rules | Spec Defined |
| SOL11 | Vault authority manipulation | Critical | Low | Pool Vaults | **Spec:** `solana-amm-spec.md` §5.2 vault owner = pool authority PDA validated every instruction | Spec Defined |
| SOL12 | Compute exhaustion | Medium | High | CLMM Swap (tick crossing) | **Spec:** `solana-clmm-spec.md` §4 max 3 tick arrays per swap; §7 compute budget analysis (~120k CU max) | Spec Defined |
| SOL13 | Account-lock contention | Medium | Medium | Hot pools | **Spec:** `solana-clmm-spec.md` §8 account-lock model — different pools parallelize, same pool serializes | Spec Defined |
| SOL14 | Missing signer validation | Critical | Medium | All Instructions | **Spec:** `solana-amm-spec.md` §4.1-4.7 every instruction documents required signers; §5.1 universal signer validation | Spec Defined |
| SOL15 | Reorg/finality inconsistency | Medium | Medium | Indexer | Deferred to Phase 7 (indexer implementation). Use confirmed/finalized commitment | Not Mitigated |
| SOL16 | Stale blockhash / transaction replay | Medium | Medium | Transaction Submission | Deferred to Phase 8 (frontend). Proper retry policy, idempotent where possible | Not Mitigated |
| SOL17 | Account close / rent manipulation | Medium | Low | Position Close, Pool Close | **Spec:** `solana-amm-spec.md` §8.3 close conditions — only when empty; `solana-clmm-spec.md` §11.8 close_position requires liquidity=0 AND tokens_owed=0 | Spec Defined |
| SOL18 | Admin key compromise | Critical | Low | All Admin Instructions | Multisig (ADR-011). **Spec:** `solana-amm-spec.md` §4.7 update_config requires config.authority signer | Spec Defined |

## 4. Shared Attack Vectors

(Same as EVM threat model §4 — token compatibility, indexer inconsistency, quote staleness, frontend compromise)

## 5. Security Controls

| Control | Applied To |
|---------|-----------|
| PDA derivation + validation | Every account in every instruction |
| Owner checks | Every account — verify program ownership |
| Signer checks | Every privileged instruction |
| Mint validation | Vault token account mints match pool config |
| Token program ID validation | Distinguish SPL Token vs Token-2022 |
| Compute budget measurement | Every instruction type |
| Multisig upgrade authority | Program deployment and upgrades |
| Fuzz / invariant testing | All math, all account validation |
| Independent Solana audit | Separate from EVM audit |

## 6. Residual Risks

| Risk | Rationale for Acceptance |
|------|------------------------|
| Solana runtime bugs | Outside protocol control; monitor for Solana security advisories |
| Account-lock contention on hot pools | Architectural limitation of Solana; mitigate with design, cannot eliminate |
| Compute limit changes | Solana may adjust compute limits; monitor and re-measure |

## 7. Review Status

- **Status:** Spec-Aligned — 16/18 vectors have spec-level mitigations defined
- **Next review:** After Phase 6 implementation — validate mitigations are correctly implemented
- **Reviewer:** [Security Reviewer — to be assigned]
- **Phase 1 spec coverage:** All account validation, math, fee, token-2022, and compute vectors addressed. Indexer (SOL15) and frontend (SOL16) deferred to implementation phases.

