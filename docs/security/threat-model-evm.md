# OmniFi — EVM Threat Model

**Version:** 1.1  
**Status:** Spec-Aligned — mitigations mapped to Phase 1 specifications  
**Date:** 2026-11-01  
**Source:** plan.md §28  
**Spec References:** `evm-clmm-spec.md`, `evm-v2-spec.md`, `fee-and-rounding-spec.md`, `token-compatibility.md`

---

## 1. Assets to Protect

| Asset | Description | Criticality |
|-------|-------------|-------------|
| User token balances | ERC-20 tokens held by users, accessed via approvals | Critical |
| Pool reserves / vault balances | Tokens held in pool contracts | Critical |
| LP positions and accrued fees | Position ownership and fee entitlements | Critical |
| Protocol fee balances | Accumulated protocol revenue | High |
| Admin and upgrade authority | Contract ownership, proxy admin, timelock | Critical |
| Signatures and authorization nonces | Permit2 nonces, EIP-712 signatures | High |
| Token registry integrity | Verified token list and risk labels | Medium |
| Price/observation data | TWAP observations if included | Medium |
| Deployment artifacts and release keys | Compiler settings, verified bytecode | High |

## 2. Threat Actors

| Actor | Capability | Motivation |
|-------|-----------|------------|
| Malicious trader | Crafts transactions to extract value | Financial gain |
| Malicious token issuer | Deploys deceptive ERC-20 contracts | Rug pull, phishing |
| Malicious LP | Manipulates pool initialization or reserves | Extract value |
| Malicious hook developer | Writes hooks that steal funds or manipulate accounting | Financial gain |
| MEV searcher | Reorders/inserts transactions | Sandwich attacks, arbitrage |
| Compromised RPC provider | Returns false data | Data manipulation |
| Compromised admin signer | Has access to admin multisig key | Unauthorized changes |
| Frontend supply-chain attacker | Compromises npm packages or build pipeline | Inject malicious code |
| Malicious dependency maintainer | Backdoors a Solidity/JS dependency | Steal funds/keys |

## 3. EVM-Specific Attack Vector Analysis

| # | Attack Vector | Severity | Likelihood | Affected Component | Mitigation Strategy | Status |
|---|--------------|----------|------------|-------------------|---------------------|--------|
| E1 | Reentrancy | Critical | Medium | Pool Core, Router | Reentrancy guards (nonReentrant), checks-effects-interactions, no external calls before state updates. **Spec:** `evm-clmm-spec.md` Appendix A `Slot0.unlocked` reentrancy guard; `evm-v2-spec.md` §3 CEI pattern | Spec Defined |
| E2 | Arithmetic overflow/underflow | Critical | Low | Pool Math, Fee Calc | Solidity 0.8+ default overflow checks, explicit unchecked blocks only where proven safe. **Spec:** `evm-clmm-spec.md` §10 overflow bounds analysis — all intermediates require `mulDiv` 512-bit; fee growth uses wrapping uint256 intentionally (§7.1, §10.4) | Spec Defined |
| E3 | Rounding and dust extraction | High | Medium | Swap Math, Fee Growth | **Spec:** `fee-and-rounding-spec.md` §4 master rounding table (13 operations); `evm-clmm-spec.md` §5.5 rounding rules per swap step; §11 dust handling. Always round against the party receiving tokens | Spec Defined |
| E4 | Incorrect fee accounting | High | Medium | Pool Core, Position Manager | **Spec:** `evm-clmm-spec.md` §7 fee growth accounting (global, per-tick, inside-position); `fee-and-rounding-spec.md` §2-3 fee application and protocol fee. Reference model: `test-vectors/clmm/reference_model.py` for differential testing | Spec Defined |
| E5 | Pool initialization manipulation | High | Medium | Factory, Pool | **Spec:** `evm-v2-spec.md` §4 MINIMUM_LIQUIDITY=1000 burned to address(0); `evm-clmm-spec.md` §11.1 minimum position size rules | Spec Defined |
| E6 | Price manipulation / sandwiching | High | High | Router, Pool Core | **Spec:** `evm-clmm-spec.md` §11.5 price limit enforcement (sqrtPriceLimitX96); `fee-and-rounding-spec.md` §6 fee disclosure requirements (priceImpact, minimumReceived) | Spec Defined |
| E7 | Flash-loan-assisted manipulation | Critical | Medium | Pool Core | No oracle in R1 (ADR-009) eliminates TWAP manipulation vector. **Spec:** `evm-clmm-spec.md` §6.5 liquidity conservation invariants | Spec Defined |
| E8 | Donation / balance-reserve mismatch | High | Medium | Pool Core | **Spec:** `evm-v2-spec.md` §6 sync/skim/donation behavior; reserve-only accounting | Spec Defined |
| E9 | Fee-on-transfer token incompatibility | High | Medium | Router, Pool | **Spec:** `token-compatibility.md` §1 EVM classification — fee-on-transfer tokens classified as "Conditional" with balance-before/after checks required | Spec Defined |
| E10 | Rebasing token incompatibility | Medium | Low | Pool Core | **Spec:** `token-compatibility.md` §1 — rebasing tokens classified as "Blocked" in R1 | Spec Defined |
| E11 | Malicious hooks / callback abuse | Critical | Low | Hook System | v4 deferred to R2 (ADR-004). No hook system in R1 — attack vector eliminated | Risk Eliminated (R1) |
| E12 | Unauthorized pool/config changes | Critical | Low | Factory, Admin | Multisig + 48h timelock (ADR-011). **Spec:** `fee-and-rounding-spec.md` §3.1 protocol fee changes require multisig + timelock | Spec Defined |
| E13 | Signature replay / nonce errors | High | Low | Permit2 Integration | Use existing audited Permit2 deployment (ADR-015), domain separation, deadline checks | Spec Defined |
| E14 | Approval phishing / excessive allowance | Medium | Medium | Frontend, Permit2 | **Spec:** `fee-and-rounding-spec.md` §6 fee disclosure requirements for all transactions | Spec Defined |
| E15 | Router recipient/input/output confusion | High | Medium | Router | Explicit recipient validation, bounded command set. Deferred to Phase 3 (implementation) | Not Mitigated |
| E16 | Partial-fill refund errors | Medium | Low | Router | Deferred in R1 per plan §19 | Deferred |
| E17 | Gas/compute exhaustion DoS | Medium | Medium | Router, Pool | **Spec:** `evm-clmm-spec.md` §6.4 bounded swap loop (nextInitializedTickWithinOneWord limits search), §9 bitmap provides O(1) tick search per word | Spec Defined |
| E18 | Admin key compromise | Critical | Low | All Admin Functions | Multisig + timelock (ADR-011), key rotation, monitoring | Spec Defined |
| E19 | Frontend dependency compromise | High | Medium | Web App | Dependency pinning, lockfile integrity, SRI, CSP. Deferred to Phase 2 (CI/CD setup) | Not Mitigated |

## 4. Shared Attack Vectors

| # | Attack Vector | Severity | Mitigation |
|---|--------------|----------|------------|
| S1 | Token compatibility false positive | High | Explicit allowlist (ADR-006), on-chain validation, reject-by-default |
| S2 | Indexer/API data inconsistency | Medium | Reconciliation worker, finality-aware queries, data truth hierarchy (§27.5) |
| S3 | Quote staleness / route manipulation | Medium | Quote expiry, block/slot context, simulation before submission |
| S4 | Frontend supply-chain attack | High | Dependency pinning, SRI, CSP headers, signed builds |

## 5. Security Controls

| Control | Applied To | Reference |
|---------|-----------|-----------|
| Least privilege | All admin roles | §28.4 |
| Multisig | Deployer, admin, guardian, upgrade | ADR-011 |
| Timelock | Config changes, upgrades | ADR-011 |
| Role separation | Deployer ≠ admin ≠ guardian ≠ fee recipient | §35 |
| Reentrancy guards | All state-modifying external functions | §13.4 |
| Dependency pinning | All npm, Foundry, Solidity dependencies | §28.4 |
| Static analysis | Slither, custom rules | §28.4 |
| Fuzz / invariant testing | All math, all state transitions | §29.2, §29.3 |
| Independent audit | All on-chain code | §30 |
| Reproducible builds | Pinned compiler, optimizer settings | §28.4 |

## 6. Residual Risks

| Risk | Rationale for Acceptance |
|------|------------------------|
| MEV/sandwich attacks | On-chain mitigation is limited; slippage protection + user education is baseline |
| Novel math bugs in CLMM | Mitigated by reference model + differential tests + audit, but zero-bug guarantee is impossible |
| Smart contract upgrade risk | Mitigated by timelock + multisig, but upgrade authority itself is a trust assumption |

## 7. Review Status

- **Status:** Spec-Aligned — 16/19 vectors have spec-level mitigations defined
- **Next review:** After Phase 3 implementation — validate mitigations are correctly implemented
- **Reviewer:** [Security Reviewer — to be assigned]
- **Phase 1 spec coverage:** All math, rounding, fee, and token-compatibility attack vectors are addressed in specifications. Router-level vectors (E15, E16) and frontend vectors (E19) are deferred to implementation phases.

