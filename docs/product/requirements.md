# OmniFi — Product Requirements Document

**Version:** 1.0  
**Status:** Draft — awaiting project owner review  
**Date:** 2026-11-01  
**Source:** Synthesized from `docs/plan.md` Sections 1–3  
**Related:** ADR-001 through ADR-015, requirements-traceability.csv

---

## 1. Personas

### 1.1 Trader

**Goal:** Swap tokens across supported chains efficiently and safely.

**Characteristics:**
- May range from retail users to professional/algorithmic traders
- Expects transparent pricing with no hidden fees
- Needs clear transaction status and finality indication
- Values speed of quotes, low slippage, and competitive routing

**Pain points:**
- Opaque fee structures and undisclosed route behavior
- False "guaranteed output" language on quotes
- Inability to distinguish submitted vs. confirmed vs. finalized transactions
- Accidental chain mismatch leading to failed transactions
- Interactions with malicious or non-standard tokens

**Constraints:**
- Must connect a supported wallet
- Must approve/authorize token spending explicitly
- Must review and confirm every swap before submission

---

### 1.2 Liquidity Provider (LP)

**Goal:** Provide liquidity to pools, earn fees, and manage positions across chains.

**Characteristics:**
- Understands AMM mechanics and impermanent loss
- For concentrated liquidity: understands price ranges and out-of-range behavior
- May manage multiple positions across pools and chains

**Pain points:**
- Lack of visibility into fee accrual and position performance
- Unclear out-of-range behavior for concentrated liquidity
- Difficulty understanding deposit ratios and pool share impact
- Position management across multiple chains

**Constraints:**
- Must understand that out-of-range concentrated-liquidity positions do not earn swap fees
- Position transferability depends on the chosen position model (ADR-008)
- Pool creation may be restricted by policy (ADR-007)

---

### 1.3 Developer / Integrator

**Goal:** Build applications or bots on top of OmniFi using the SDK and API.

**Characteristics:**
- Expects documented, typed, versioned interfaces
- Needs stable error codes and predictable behavior
- Must handle chain-specific differences explicitly

**Pain points:**
- False abstraction layers that hide critical chain differences
- Floating-point accounting in SDK/API responses
- Undocumented error codes or inconsistent error formats
- Breaking API changes without versioning

**Constraints:**
- Must not assume EVM and Solana transaction semantics are identical
- Must use integer-string representations for all token amounts
- Must handle quote expiry and stale data

---

### 1.4 Protocol Operator

**Goal:** Monitor, administer, and maintain the protocol safely.

**Characteristics:**
- Responsible for health monitoring, incident response, and configuration
- Operates with least-privilege access
- Must follow documented procedures for all administrative actions

**Pain points:**
- Excessive admin privileges leading to single points of failure
- Lack of monitoring for critical protocol invariants
- Missing runbooks for incident scenarios

**Constraints:**
- Only explicitly authorized administrative controls may be used
- Pause authority is narrowly scoped per component
- All admin actions must be logged and auditable
- Multisig required for sensitive operations (ADR-011)

---

## 2. User Journeys

### 2.1 Trader — Swap Flow

```
1. Connect supported wallet
2. Select source network
3. Select input token and amount
4. Select output token
5. System displays:
   - Route and each hop
   - Expected output amount
   - Price impact
   - Fee breakdown (LP fee, protocol fee, hook fee if applicable, network fee)
   - Minimum received (based on slippage setting)
   - Quote expiry / freshness indicator
   - Estimated gas (EVM) or compute/priority fee (Solana)
   - Token risk warnings (if unverified/risky token)
6. Adjust slippage setting if desired
7. If token approval needed → approve/authorize token spending
8. Review final transaction confirmation
9. Simulate transaction (optional/automatic)
10. Submit swap
11. Track transaction status:
    - Pending → Submitted → Confirmed → Finalized
    - OR: Failed / Rejected / Replaced
12. View transaction in explorer
13. View in transaction history
```

**Decision points:**
- Step 5: User may abort if price impact is too high
- Step 7: User must explicitly approve token spending
- Step 8: User must confirm final transaction details
- Step 10: Wallet signature is user-controlled — cannot be automated

### 2.2 Liquidity Provider — Add Liquidity (Concentrated)

```
1. Connect wallet and select network
2. Browse or search for pools
3. Select pool (token pair + fee tier)
4. View pool details:
   - Current price
   - TVL and volume
   - Fee tier
   - Pool type (constant-product vs. concentrated)
5. Choose "Add Liquidity"
6. Select price range (lower tick, upper tick)
7. System displays:
   - Current price vs. selected range
   - In-range / out-of-range status
   - Required token amounts for selected range and liquidity
   - Estimated position liquidity
   - Warning if out-of-range (will not earn fees)
8. Enter desired token amount (system calculates counterpart)
9. Approve tokens if needed
10. Review and confirm
11. Submit transaction
12. Track confirmation
13. View position in portfolio:
    - Deposited amounts
    - Current range status
    - Accrued fees
    - Collectable fees
```

### 2.3 Liquidity Provider — Remove Liquidity & Collect Fees

```
1. View position portfolio
2. Select position
3. Choose action: Decrease Liquidity / Collect Fees / Close Position
4. For decrease: specify amount or percentage
5. System shows:
   - Tokens to receive
   - Remaining position (if partial)
   - Fees collectible
6. Confirm and submit
7. Track confirmation
```

### 2.4 Developer — SDK Integration

```
1. Install SDK package (sdk-evm, sdk-solana, or sdk-unified)
2. Configure network and RPC
3. Discover tokens by network
4. Query pool state
5. Request quote (exact input or exact output)
6. Receive route with fee breakdown and price impact
7. Build transaction/instruction
8. Simulate transaction
9. Submit via user's wallet/signer
10. Track confirmation/finality
11. Query position state and history
```

### 2.5 Protocol Operator — Incident Response

```
1. Receive monitoring alert (e.g., unexpected vault balance change)
2. Consult runbook for alert type
3. Assess severity and scope
4. If emergency: exercise narrowly-scoped pause authority
5. Preserve evidence (logs, chain state, transaction hashes)
6. Escalate per operational model
7. Communicate status
8. Investigate root cause
9. Implement fix (in test environment first)
10. Resume operations with monitoring
11. Conduct post-incident review
```

---

## 3. Release 1 Scope — Core DEX

### 3.1 Included Features

| # | Feature | Chain | Conditional | Notes |
|---|---------|-------|-------------|-------|
| 1 | Constant-product AMM pools | EVM | ADR-002 | Reference implementation; included only if justified |
| 2 | Concentrated-liquidity pools | EVM | — | Required for R1 |
| 3 | v4-inspired singleton pool architecture | EVM | ADR-004 | Separately specified and security-gated |
| 4 | Native AMM pools | Solana | — | Required for R1 |
| 5 | Native concentrated-liquidity pools | Solana | ADR-005 | After dedicated account-model and math spec |
| 6 | Pool creation and initialization policy | Both | ADR-007 | Spam controls required |
| 7 | Swaps and multi-hop routing | Both | — | Bounded route search |
| 8 | Liquidity positions and fee collection | Both | ADR-008 | Full lifecycle |
| 9 | Token approval and authorization workflows | Both | ADR-015 | Permit2 or standard approvals |
| 10 | Quote engine and transaction simulation | Both | — | Chain-specific simulation |
| 11 | SDK (EVM + Solana + Unified) | N/A | — | Typed, no floating-point |
| 12 | Versioned REST API | N/A | — | OpenAPI published |
| 13 | EVM event indexer | EVM | — | Reorg-aware |
| 14 | Solana account/event indexer | Solana | — | Fork-aware |
| 15 | Analytics and pool discovery | Both | — | Via indexer projections |
| 16 | Frontend (Swap, Pools, Positions, History) | Both | — | Responsive, accessible |
| 17 | Monitoring, alerts, and operational controls | Both | ADR-013 | Including pause authority |
| 18 | Security assurance (audit, threat model) | Both | — | Required before mainnet |

### 3.2 Acceptance Criteria (per feature)

Each feature must satisfy:
- Working implementation (not stubs)
- Unit tests covering math, state transitions, access control, validation, errors, fees, rounding, token compatibility
- Property/invariant tests for accounting and authorization
- Integration tests for user journeys
- Documentation updated
- Security review for on-chain code
- Traceability matrix updated with evidence

---

## 4. Explicit Exclusions (Release 1)

> [!CAUTION]
> These features **must not** be quietly added to the Core DEX release.

| # | Excluded Feature | Rationale |
|---|-----------------|-----------|
| 1 | Lending, borrowing, collateral, liquidations | Separate product with distinct risk profile |
| 2 | Yield aggregators, vaults, auto-compounding | Separate product |
| 3 | Perpetuals, options, margin, leverage | Separate product |
| 4 | Fiat on/off ramps and custody | Regulatory complexity |
| 5 | Arbitrary cross-chain messaging | Requires separate bridge risk review |
| 6 | Token bridge / wrapped-asset bridge | Requires separate bridge risk review |
| 7 | Governance token, DAO voting, treasury | Release 2 scope |
| 8 | Permissionless hook marketplace | High risk; only reviewed hooks in R1 |
| 9 | Arbitrary user-supplied program execution | High risk |
| 10 | MEV-protected private order flow | Unless separately designed and approved |
| 11 | Intent-based solver / RFQ market | Unless separately designed and approved |

---

## 5. Later Releases

| Release | Scope | Prerequisite |
|---------|-------|-------------|
| R2 | Governance and controlled protocol configuration | Own PRD, threat model, architecture, audit |
| R3 | Lending and liquidation | Own PRD, threat model, architecture, accounting spec, audit |
| R4 | Restricted cross-chain messaging/asset transfer | Separate bridge risk review |
| R5 | Advanced trading (intents, RFQ, protected order flow) | Own PRD, threat model, architecture, audit |

Each later release begins with a fresh discovery phase. They are not automatic continuations of R1.

---

## 6. Success Metrics (Draft)

> [!NOTE]
> Exact target values must be set by the project owner. These are the metric categories.

| Category | Metric | Target |
|----------|--------|--------|
| **Adoption** | Total Value Locked (TVL) | TBD |
| **Adoption** | Daily active wallets | TBD |
| **Volume** | Daily swap volume (USD equivalent) | TBD |
| **Volume** | Number of daily swaps | TBD |
| **Reliability** | API uptime | TBD (see ADR-013) |
| **Reliability** | Swap success rate | TBD |
| **Reliability** | Indexer lag (seconds behind chain head) | TBD |
| **Performance** | Quote API p95 latency | TBD (see ADR-013) |
| **Performance** | Frontend time-to-interactive | TBD |
| **Security** | Critical/high audit findings unresolved | 0 |
| **Security** | Reconciliation mismatch rate | < threshold TBD |
| **Developer** | SDK integration time (first swap) | TBD |
| **Developer** | API documentation coverage | 100% of endpoints |

---

## 7. Product Principles (Testable Statements)

| # | Principle | Testable Criterion |
|---|-----------|-------------------|
| 1 | Non-custodial by design | No contract/program can custody user funds without explicit user action |
| 2 | Explicit user authorization | Every token transfer requires wallet signature; no hidden approvals |
| 3 | Deterministic accounting | All fee/amount calculations use integer arithmetic with documented rounding |
| 4 | Fail closed | Invalid config, stale data, or unsupported tokens cause rejection, not silent processing |
| 5 | Least privilege | Admin roles are separated and narrowly scoped (ADR-011) |
| 6 | No hidden fees | All fees (LP, protocol, hook, network) are visible before confirmation |
| 7 | Fee separation | Protocol fee, LP fee, hook fee, network fee are displayed separately |
| 8 | Reproducible builds | Build from source produces identical artifacts |
| 9 | Observable state | All state transitions emit events; off-chain services have health monitoring |
| 10 | Chain-specific documentation | EVM and Solana security assumptions documented separately |
| 11 | Security over features | No feature ships without meeting its security gate |

---

## 8. Review and Approval

- [ ] Product owner has reviewed all sections
- [ ] Personas accurately represent target users
- [ ] User journeys cover all R1 interactions
- [ ] R1 scope is agreed upon
- [ ] Exclusions are accepted
- [ ] Success metric categories are appropriate (values TBD)
- [ ] Product principles are non-negotiable

**Approved by:** _______________  
**Date:** _______________

