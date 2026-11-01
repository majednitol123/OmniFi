# OmniFi — Test Strategy

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-11-01  
**Source:** plan.md §29

---

## Principle

Testing is a **release requirement**, not a final polish step. Every layer requires tests appropriate to its risk profile. A green test suite is an indicator, not proof of security.

---

## 1. Unit Tests (§29.1)

**Scope:** Every individual function in isolation.

| Target | Coverage Requirements |
|--------|----------------------|
| Math functions | Every swap formula, liquidity calculation, tick conversion, fee growth |
| State transitions | Pool init → active → paused, position open → modify → close |
| Access control | Every role-gated function with authorized and unauthorized callers |
| Validation | Every input validation branch (min/max, zero, overflow, invalid) |
| Error conditions | Every revert/error path with correct error code |
| Fee calculations | Every fee tier, rounding boundary, protocol fee split |
| Rounding boundaries | Min tick, max tick, zero liquidity, max liquidity, dust amounts |
| Token compatibility | Each supported and unsupported token behavior case |

**Tools:** Foundry (`forge test`) for EVM, Anchor/`cargo test` for Solana, Vitest/Jest for TypeScript

## 2. Property & Invariant Tests (§29.2)

### EVM Invariants

- Pool reserve accounting is conserved after any valid operation sequence
- No user can withdraw more than entitled (position value + fees)
- Total liquidity accounting equals sum of all position liquidity
- Fees accrue to correct positions and are never double-counted
- Unauthorized callers cannot change protected configuration
- Router cannot deliver below minimum output
- Position ownership and liquidity accounting remain consistent after any sequence

### Solana Invariants

- Only valid PDA authorities control vaults
- Pool vault mint/authority relationships remain valid after any instruction sequence
- No instruction can debit a vault beyond authorized accounting
- Position liquidity and fee accounting remain consistent
- Invalid account substitutions always fail
- Required signer and owner constraints are enforced for every instruction
- CPI cannot exceed intended authority
- Account close operations cannot destroy non-empty or valuable state

**Tools:** Foundry invariant tests, Trident (Solana fuzz framework)

## 3. Fuzz Testing (§29.3)

| Fuzz Target | Input Domain |
|-------------|-------------|
| Token amounts | 0, 1, dust threshold, typical, `type(uint256).max` |
| Prices | Near min tick, near max tick, at tick boundaries |
| Liquidity | 0, minimum, typical, maximum for pool |
| Fee values | Every allowed boundary (0%, min tier, max tier) |
| Operation sequences | Random add/remove/swap sequences (100K+ iterations) |
| Overlapping positions | Multiple positions with intersecting ranges |
| Malformed calldata | Random bytes to instruction parsers |
| Router commands | Random command sequences with valid/invalid args |
| Nonce and deadline | Expired, future, boundary values |

**Duration:** Minimum 24-hour fuzz campaigns per target. Seed corpus preserved.

## 4. Differential Testing (§29.4)

| Comparison | What is Compared |
|-----------|-----------------|
| On-chain math vs Python reference model | Swap output, fee calculation, position value |
| Quote engine vs contract/program simulation | Quoted amount vs actual execution |
| EVM vs reference test vectors | CLMM math results vs `packages/test-vectors/clmm/vectors.json` |
| Solana vs reference test vectors | Solana CLMM results vs `packages/test-vectors/solana-clmm/vectors.json` |
| Indexer projections vs on-chain reads | Pool state, position state, vault balances |

## 5. Integration & E2E Tests (§29.5)

| Scenario | Chains | Components Involved |
|----------|--------|-------------------|
| Wallet connect + network switch | Both | Frontend, wallet adapter |
| Token discovery | Both | Frontend, API, token registry |
| Token approval/authorization | Both | Frontend, SDK, contract/program |
| Quote + route refresh | Both | Frontend, quote API, chain reader |
| Swap simulation + submission | Both | Frontend, SDK, router, pool |
| Transaction confirm/finalize | Both | Frontend, SDK, indexer |
| Add/remove liquidity | Both | Frontend, SDK, position manager, pool |
| Position fee collection | Both | Frontend, SDK, position manager |
| Indexer event processing | Both | Indexer, database |
| Reorg/fork recovery | Both | Indexer, reconciliation worker |
| RPC outage + failover | Both | Chain adapter, RPC config |
| API rate limiting | N/A | API, rate limiter |
| Rejected wallet signature | Both | Frontend, wallet adapter |
| Failed transaction handling | Both | Frontend, SDK, error mapping |

## 6. Load & Resilience Tests (§29.6)

| Scenario | Target |
|----------|--------|
| Quote API throughput | Sustain X req/s (per ADR-013 SLO) |
| Pool discovery latency | p95 < 200ms under load |
| Indexer throughput | Process X events/s without lag increase |
| Database query performance | Query plans reviewed, no full table scans |
| Cache failure | System degrades gracefully without Redis |
| RPC degradation | Failover activates within 10s |
| Worker restart + replay | No duplicate processing, idempotent |

## 7. Required Test Evidence (§29.7)

For every release candidate, store:

| Evidence | Location |
|----------|----------|
| Commit hash | Release manifest |
| Toolchain versions | `foundry.toml`, `Anchor.toml`, `package.json` |
| Test commands | `docs/release/test-commands.md` |
| Test output | CI artifacts |
| Coverage report | CI artifacts (not a substitute for specific tests) |
| Fuzz run duration + seed corpus | CI artifacts |
| Invariant test results | CI artifacts |
| Static analysis reports | CI artifacts |
| Known exclusions + reasons | Release notes |
| Build artifact hashes | Release manifest |

