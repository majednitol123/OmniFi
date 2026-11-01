# OmniFi — Production-Oriented Multi-Chain DeFi DEX Engineering Plan

**Document type:** Agent execution specification and project source of truth  
**Version:** 2.0  
**Status:** Pre-development baseline — no implementation has started  
**Audience:** Autonomous coding agent, protocol engineers, smart-contract engineers, backend engineers, frontend engineers, DevOps/SRE, security reviewers  
**Primary product:** A Uniswap-class decentralized exchange (DEX) with independently engineered EVM and Solana implementations  
**Implementation rule:** Build in gated, reviewable increments. Never interpret this document as permission to deploy unaudited contracts or handle real user funds.

---

## 0. How the agent must use this document

This file is the authoritative project plan. Read it completely before creating code.

### 0.1 Non-negotiable execution rules

1. **Do not start by generating the whole codebase.** First complete Phase 0 discovery, architecture decisions, threat model, protocol specifications, repository design, and acceptance tests.
2. Work in small vertical slices. Each slice must compile, test, document, and pass review before the next slice begins.
3. Never mark a requirement complete because files or function stubs exist. Completion requires working implementation and evidence.
4. Never invent chain IDs, RPC URLs, token addresses, program IDs, deployment addresses, API keys, signer keys, production credentials, or audit results.
5. Keep EVM and Solana execution implementations separate. Solidity contracts are not portable to Solana; Anchor programs are not portable to the EVM.
6. Shared code may cover domain terminology, API contracts, SDK ergonomics, schemas, UI components, analytics definitions, and test vectors only where semantics are genuinely equivalent. Chain-specific behavior must remain explicit.
7. Do not silently substitute a third-party protocol for a native implementation. Any dependency or integration must be proposed in an ADR and approved.
8. Do not implement a bridge, lending market, leverage, perpetuals, yield vault, or governance product in the Core DEX release.
9. Do not use unaudited or untrusted hooks, arbitrary external calls, arbitrary token adapters, or unrestricted plugin execution with user funds.
10. Do not claim “production-ready”, “secure”, “audited”, or “battle-tested” without objective evidence and the required independent review.
11. Do not deploy to a public network or request real funds. Use local development and test networks until explicit release authorization is provided by the project owner.
12. If a requirement is ambiguous, stop that workstream, write an ADR with options, risks, and a recommendation, and request a decision. Do not guess.
13. Keep secrets out of source control, logs, test fixtures, screenshots, generated docs, and agent memory.
14. Every change must include tests and documentation appropriate to the affected layer.
15. Preserve a traceable link between requirements, design, implementation, tests, and release evidence.

### 0.2 Required agent workflow

For every task:

1. Read this plan and the relevant ADRs.
2. Identify the requirement IDs affected.
3. Inspect existing repository state before editing.
4. Write a short implementation plan and list assumptions.
5. Implement the smallest coherent change.
6. Run formatting, linting, static analysis, unit tests, integration tests, and relevant invariant/fuzz tests.
7. Review the diff for security, correctness, backwards compatibility, and accidental scope expansion.
8. Update documentation, ADRs, test evidence, and the traceability matrix.
9. Report changed files, commands run, results, known limitations, and next step.
10. Never report a test as passed unless it was actually executed and its output was checked.

### 0.3 Definition of project status

Use only these statuses:

- `NOT_STARTED`
- `IN_DISCOVERY`
- `SPECIFIED`
- `IN_PROGRESS`
- `IMPLEMENTED`
- `TESTED`
- `SECURITY_REVIEWED`
- `AUDIT_REMEDIATED`
- `RELEASE_APPROVED`
- `BLOCKED`
- `DEFERRED`

A feature is not production-ready merely because it is `IMPLEMENTED` or `TESTED`.

---

# Part I — Product definition and scope

## 1. Product vision

OmniFi is a non-custodial, multi-chain DEX product. It provides a familiar swap and liquidity experience across selected EVM networks and Solana while maintaining separate chain-native protocol implementations.

The initial product should deliver a dependable DEX before expanding into lending, yield, governance, or cross-chain asset movement.

### 1.1 Core user journeys

**Trader**
- Connect a supported wallet.
- Select the source network and token pair.
- View token metadata and verified token status.
- Receive a quote with route, expected output, price impact, fees, gas/compute estimate, and quote expiry.
- Review price impact, minimum received, slippage, route, and transaction details.
- Approve or authorize token spending using the supported approval path.
- Simulate and submit the swap.
- Track pending, confirmed, finalized, failed, or replaced transaction status.
- View transaction history and explorer link.

**Liquidity provider**
- Discover pools and inspect pool parameters.
- Create or initialize an eligible pool if permitted.
- Add liquidity to a supported pool.
- For concentrated liquidity, select a price range and understand out-of-range behavior.
- View position ownership, deposited amounts, fees, rewards if enabled, and current range status.
- Increase or decrease liquidity.
- Collect fees and withdraw liquidity.
- Transfer or manage a position token only if the position model explicitly supports it.
- See transaction and position history.

**Developer / integrator**
- Use documented SDK methods for token discovery, pool reads, quotes, transaction building, simulation, submission, and event access.
- Consume stable API schemas and documented error codes.
- Verify chain-specific behavior without assuming that EVM and Solana transaction semantics are identical.

**Protocol operator**
- Monitor protocol health, pool activity, indexer lag, RPC health, failed transactions, and security alerts.
- Operate only explicitly authorized administrative controls.
- Pause a narrowly scoped component in an emergency where the architecture supports it.
- Follow documented incident, recovery, and release procedures.

## 2. Product boundaries

### 2.1 Release 1 — Core DEX

Release 1 includes:

- EVM constant-product AMM pools as a reference implementation.
- EVM concentrated-liquidity pools.
- An EVM v4-inspired singleton pool architecture as a separately specified and security-gated workstream.
- Solana-native AMM pools.
- Solana-native concentrated-liquidity pools, only after a dedicated account-model and math specification.
- Pool creation and initialization policy.
- Swaps and multi-hop routing.
- Liquidity positions and fee collection.
- Token approval and authorization workflows.
- Quote engine and transaction simulation.
- SDK, API, indexer, analytics, and frontend.
- Monitoring, operational controls, and security assurance.

### 2.2 Explicitly out of scope for Release 1

These must not be quietly added to the Core DEX:

- Lending, borrowing, collateral management, and liquidations.
- Yield aggregators, vaults, auto-compounding, and strategy execution.
- Perpetuals, options, margin, and leverage.
- Fiat on/off ramps and custody.
- Arbitrary cross-chain messaging.
- General-purpose token bridge or canonical wrapped-asset bridge.
- Governance token, DAO voting, and treasury management.
- Permissionless arbitrary hook marketplace.
- Arbitrary user-supplied program or contract execution.
- MEV-protected private order flow unless separately designed and approved.
- Intent-based solver network or RFQ market unless separately designed and approved.

### 2.3 Later product releases

Each later product must have its own product requirements, threat model, architecture, accounting specification, test strategy, security review, and release gate:

- Release 2: governance and controlled protocol configuration.
- Release 3: lending and liquidation.
- Release 4: restricted cross-chain messaging or asset transfer, only after a separate bridge risk review.
- Release 5: optional advanced trading features such as intents, RFQ, or protected order flow.

## 3. Product principles

- Non-custodial by design.
- Explicit user authorization for every asset movement.
- Deterministic and reviewable accounting.
- Fail closed on invalid configuration, stale critical data, or unsupported token behavior.
- Least privilege for admin and operational roles.
- No hidden fees or undisclosed route behavior.
- Clear separation of protocol fee, LP fee, hook fee, network fee, and aggregator/service fee.
- Reproducible builds and deployment artifacts.
- Observable state transitions and recoverable off-chain services.
- Chain-specific security assumptions documented separately.
- Security and user protection take precedence over feature count.

---

# Part II — Discovery and architecture decisions

## 4. Phase 0: discovery — mandatory before coding

The project owner and agent must produce the following artifacts before implementation:

| Artifact | Required content | Acceptance evidence |
|---|---|---|
| Product requirements document | Personas, user journeys, scope, exclusions, success metrics | Reviewed and approved |
| Chain selection record | Exact EVM networks and Solana cluster(s), rationale, finality, RPC requirements | ADR accepted |
| Token policy | Supported standards, allowlist/denylist approach, metadata trust model | Security review |
| Protocol version strategy | Which AMM generations are native, integrated, or deferred | ADR accepted |
| Economic specification | Fee model, rounding, dust, minimums, protocol revenue policy | Math review |
| Threat model | Assets, trust boundaries, attackers, abuse cases, mitigations | Security sign-off |
| Operational model | Roles, keys, pause policy, monitoring, incident ownership | Operations review |
| Delivery plan | Workstreams, dependencies, staffing assumptions, milestones | Approved |
| Test strategy | Unit, integration, invariant, fuzz, differential, fork, adversarial tests | Approved |
| Release policy | Testnet, audit, remediation, deployment, monitoring, rollback gates | Approved |

### 4.1 Decisions that must remain open until evidence exists

Do not make up answers for these:

- Exact EVM networks and their chain IDs.
- Solana cluster and deployment program IDs.
- Whether EVM v2 compatibility is required or only a test/reference pool.
- Whether the concentrated-liquidity implementation is original or based on a reviewed, license-compatible dependency.
- Whether the v4-inspired engine is a full native implementation, a limited subset, or deferred.
- Whether the Solana CLMM is original or an approved integration.
- Supported token list and token risk tiers.
- Fee tiers, tick spacing, protocol fee limits, and hook fee limits.
- Pool creation permissions and spam controls.
- Position representation and transferability on each chain.
- Oracle use cases, if any, in the DEX core.
- Upgradeability or immutability policy for every on-chain component.
- Admin custody and signing model.
- RPC, indexing, analytics, hosting, and monitoring vendors.
- Target throughput, latency, and availability objectives.
- Legal, compliance, and jurisdictional requirements.

Each unresolved decision must be captured in `docs/adr/ADR-NNN-title.md`.

## 5. Architecture decision record (ADR) template

Every material decision must use this template:

```md
# ADR-NNN: Title
- Status: Proposed | Accepted | Rejected | Superseded
- Date:
- Owners:
- Related requirements:

## Context
## Decision drivers
## Options considered
## Decision
## Security implications
## Economic implications
## Operational implications
## Alternatives rejected
## Migration / rollback plan
## Open questions
```

No material architecture choice should exist only in chat or agent notes.

## 6. Network registry

Create a versioned network registry. Never scatter chain IDs or RPC URLs through application code.

Each network entry must define:

- Stable internal network key.
- Namespace: `eip155` or `solana`.
- Chain ID or cluster identifier.
- Display name and native currency.
- RPC endpoint configuration by environment.
- WebSocket endpoint if supported.
- Explorer URL template.
- Finality/confirmation policy.
- Supported wallet adapters.
- Token standards and metadata source.
- Protocol deployment addresses or program IDs, only after deployment.
- Deployment version and code/program hash.
- Feature flags.
- Indexer start checkpoint.
- Health-check configuration.

Secrets and private RPC credentials must be injected through a secret manager or runtime environment, not committed.

---

# Part III — System architecture

## 7. High-level architecture

```text
                         ┌────────────────────────────┐
                         │       Web Application      │
                         │ Swap / Pools / Positions   │
                         │ Wallet / History / Admin   │
                         └─────────────┬──────────────┘
                                       │
                         ┌─────────────▼──────────────┐
                         │       API / BFF Layer      │
                         │ Auth, rate limits, schema  │
                         └──────┬──────────────┬──────┘
                                │              │
                    ┌───────────▼───┐   ┌──────▼───────────┐
                    │ Quote / Route │   │ Indexer / Query  │
                    │ Simulation    │   │ Analytics        │
                    └───────┬───────┘   └──────┬───────────┘
                            │                  │
              ┌─────────────▼─────┐    ┌───────▼───────────┐
              │ Chain Adapters    │    │ PostgreSQL       │
              │ EVM / Solana      │    │ Redis (optional) │
              └──────┬───────┬────┘    └───────────────────┘
                     │       │
          ┌──────────▼─┐   ┌─▼─────────────────┐
          │ EVM Layer  │   │ Solana Layer      │
          │ Solidity   │   │ Rust / Anchor     │
          │ Contracts │   │ Programs / PDAs   │
          └────────────┘   └───────────────────┘

      Observability: metrics, logs, traces, alerts, dashboards
      Security: key management, CI scanning, release attestations
```

## 8. Repository structure

Use a monorepo only if the team can enforce package boundaries and independent build/test pipelines. Proposed structure:

```text
omnifi/
├── apps/
│   ├── web/                       # User-facing DEX application
│   ├── admin/                     # Restricted operations UI; optional
│   └── api/                       # Backend-for-frontend / public API
├── packages/
│   ├── domain/                    # Chain-neutral domain types only
│   ├── api-client/                # Generated API client
│   ├── sdk-evm/                   # EVM-specific SDK
│   ├── sdk-solana/                # Solana-specific SDK
│   ├── sdk-unified/               # Explicitly chain-discriminated facade
│   ├── quote-engine/              # Off-chain quote and route search
│   ├── token-registry/            # Curated token metadata and risk labels
│   ├── ui/                        # Shared UI primitives
│   ├── config/                    # Validated configuration
│   └── test-vectors/              # Shared mathematical vectors where valid
├── chains/
│   ├── evm/
│   │   ├── foundry.toml
│   │   ├── src/
│   │   │   ├── common/
│   │   │   ├── v2/
│   │   │   ├── clmm/
│   │   │   ├── v4-core/
│   │   │   ├── periphery/
│   │   │   ├── router/
│   │   │   └── interfaces/
│   │   ├── test/
│   │   ├── script/
│   │   └── docs/
│   └── solana/
│       ├── Anchor.toml
│       ├── programs/
│       │   ├── omnifi_amm/
│       │   ├── omnifi_clmm/
│       │   ├── omnifi_router/
│       │   └── omnifi_position_manager/  # Only if separate program is justified
│       ├── tests/
│       ├── migrations/
│       └── docs/
├── services/
│   ├── indexer-evm/
│   ├── indexer-solana/
│   ├── quote-api/
│   ├── notification-worker/
│   └── reconciliation-worker/
├── infra/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/                # If infrastructure-as-code is selected
│   ├── monitoring/
│   └── runbooks/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── protocol/
│   ├── security/
│   ├── operations/
│   ├── adr/
│   ├── api/
│   └── release/
├── tests/
│   ├── e2e/
│   ├── differential/
│   ├── load/
│   └── security/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json                    # Or another approved build orchestrator
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
└── LICENSE
```

The exact tooling may change through ADR. Do not add empty placeholder packages without a near-term implementation purpose.

## 9. Technology baseline

Proposed baseline; versions must be pinned and checked against current stable releases at project kickoff.

| Area | Preferred baseline | Notes |
|---|---|---|
| EVM contracts | Solidity, Foundry | Pin compiler and optimizer settings |
| EVM testing | Foundry, fuzz/invariant tests | Add static analysis and independent review |
| Solana programs | Rust, Anchor where appropriate | Pin Rust/Anchor/Solana toolchain |
| Frontend | TypeScript, React, Next.js or approved equivalent | Avoid mixing chain logic into UI |
| EVM wallet integration | Viem + approved wallet connector | Chain-specific transaction handling |
| Solana wallet integration | Solana Wallet Adapter / approved equivalent | Cluster and account constraints |
| Backend | TypeScript service framework | Choose one and document |
| Database | PostgreSQL | Canonical off-chain query store, not protocol truth |
| Cache | Redis, optional | Cache only reconstructable data |
| Messaging | Optional NATS/Kafka | Add only when operationally justified |
| Containers | Docker | Reproducible local environment |
| Orchestration | Kubernetes only if justified | Do not introduce operational complexity prematurely |
| Observability | OpenTelemetry-compatible stack | Metrics, logs, traces |
| Secrets | Cloud secret manager / HSM / multisig | Never store production keys in repo |

Do not use a technology because it appears in the table if it is not needed. Record any replacement in an ADR.

---

# Part IV — Protocol requirements and shared domain model

## 10. Common domain vocabulary

Define chain-neutral types only for concepts with equivalent semantics:

- `NetworkRef`
- `AssetRef`
- `PoolRef`
- `PoolType`
- `PoolStateSnapshot`
- `SwapQuote`
- `Route`
- `RouteHop`
- `LiquidityPositionSummary`
- `TransactionIntent`
- `TransactionLifecycle`
- `TokenRiskStatus`
- `FeeBreakdown`
- `PriceImpact`
- `FinalityStatus`

Every object must carry a chain namespace and network identity. Never identify a token by symbol or address alone.

### 10.1 Asset identity

EVM asset identity:
- Namespace: `eip155`
- Chain ID
- Checksummed address
- Token standard / behavior classification

Solana asset identity:
- Namespace: `solana`
- Cluster
- Mint address
- Token program ID (classic Token Program or Token-2022 program)
- Relevant extension configuration

Symbols and names are display metadata, not unique identifiers.

### 10.2 Amount representation

- Store raw on-chain quantities as integer strings or arbitrary-precision integers.
- Never use JavaScript floating-point numbers for token amounts, prices, fees, or accounting.
- Store token decimals as metadata, validated against chain state where possible.
- Keep display formatting separate from calculations.
- Define rounding direction for every calculation.
- Reject overflow, underflow, invalid precision, and unsupported decimal assumptions.

## 11. Token compatibility and risk policy

A token must not be treated as standard merely because it exposes a familiar interface.

### EVM token policy

Classify and test:
- Standard ERC-20 behavior.
- Tokens returning no boolean from `transfer`/`transferFrom`.
- Fee-on-transfer tokens.
- Rebasing tokens.
- Pausable or blacklistable tokens.
- Callback-capable or reentrant behavior.
- Non-standard decimals.
- Tokens with upgradeable or mutable implementation.
- Malicious or misleading metadata.
- Tokens with transfer restrictions.

Release 1 should use an explicit supported-token policy. Unsupported behavior must be rejected or clearly marked; do not claim universal ERC-20 compatibility.

### Solana token policy

Classify:
- SPL Token classic.
- Token-2022.
- Transfer-fee extension.
- Transfer-hook extension.
- Permanent delegate.
- Default account state / freeze authority.
- Non-transferable extension.
- Interest-bearing or scaled UI amount extension.
- Confidential transfer and other unsupported extensions.

Release 1 must explicitly define which extensions are supported, rejected, or conditionally supported. Validate token program IDs and extension configuration. Do not infer compatibility from a mint address alone.

### Token registry requirements

- Curated token list by network.
- Verification status and risk labels.
- Source and timestamp for metadata.
- Token program / standard classification.
- Decimal and mint/address validation.
- Warning UI for unverified assets.
- No automatic trust based on symbol or logo.
- Admin changes must be reviewed, logged, and versioned.
- Token list must not be a substitute for on-chain validation.

---

# Part V — EVM protocol engineering

## 12. EVM architecture overview

EVM contracts are an independent implementation. The EVM workstream must document:
- Contract boundaries.
- Storage layout.
- Access control.
- Upgradeability or immutability.
- External-call boundaries.
- Token transfer assumptions.
- Reentrancy assumptions.
- Fee accounting.
- Rounding rules.
- Events and errors.
- Deployment order.
- Verification and reproducible build process.

Separate contracts by protocol generation and purpose. Do not combine unrelated pool engines into one unreviewable contract.

## 13. EVM V2-style constant-product AMM

This is a reference AMM and may be included in Release 1 only if product requirements justify it.

### 13.1 Required components

- Factory or controlled pool registry.
- Pair/pool contract.
- Router.
- Optional liquidity-token implementation.
- Fee configuration.
- Protocol fee accounting, if approved.

### 13.2 Core invariant

For a two-asset pool, define reserves \(x\) and \(y\), input \(a\), and fee multiplier consistently. The implementation must specify exact integer arithmetic and rounding. The constant-product invariant is based on \(x \cdot y = k\), with the swap fee applied according to the published formula.

Do not copy formulas from memory without independently verifying:
- Fee placement.
- Integer division.
- Rounding direction.
- Reserve update order.
- Minimum liquidity or initial-liquidity policy.
- Donation and sync behavior.
- Protocol fee minting or accounting.

### 13.3 Required operations

- Create or initialize pool.
- Add liquidity.
- Remove liquidity.
- Swap exact input.
- Swap exact output, if supported.
- Multi-hop swap.
- Quote exact input/output.
- Read reserves and cumulative observations, if implemented.
- Collect or account for protocol fees, if enabled.

### 13.4 Security requirements

- Reentrancy protection or a proven alternative.
- Safe token transfer handling.
- Checks-effects-interactions.
- No arbitrary external calls.
- Correct reserve accounting.
- Minimum liquidity / dust protection.
- Fee-on-transfer policy explicitly enforced.
- Integer overflow and rounding tests.
- Initial pool manipulation tests.
- Donation and balance/reserve divergence tests.
- Factory and router authorization tests.

## 14. EVM concentrated-liquidity AMM

Concentrated liquidity is a separate mathematical and security workstream. It must not be treated as a minor extension of V2.

### 14.1 Required concepts

- Pool identity: token0, token1, fee tier, tick spacing, and any additional immutable configuration.
- Square-root price representation.
- Tick-to-price and price-to-tick conversion.
- Liquidity amount calculations.
- Tick initialization and bitmap/indexing.
- Position boundaries.
- Active liquidity.
- Swap step calculation.
- Fee growth global and per tick.
- Fee growth inside a position.
- Tick crossing and liquidity net updates.
- Position accounting and collection.
- Observation/oracle design if included.
- Protocol fee accounting if enabled.

### 14.2 Required user operations

- Initialize pool.
- Mint liquidity position.
- Increase liquidity.
- Decrease liquidity.
- Collect fees and withdrawn tokens.
- Swap exact input.
- Swap exact output, if supported.
- Multi-hop swap.
- Read pool state and position state.
- Quote and simulate transactions.

### 14.3 Required mathematical specifications

Before implementation, write and review:
- Fixed-point formats and constants.
- Tick range and tick spacing rules.
- Price conversion and rounding.
- Liquidity calculation formulas.
- Swap step formulas.
- Fee growth formulas.
- Position valuation.
- Tick crossing semantics.
- Overflow bounds.
- Maximum iterations and gas bounds.
- Dust handling.
- Boundary behavior at minimum and maximum ticks.

All math must have high-precision reference implementations and deterministic test vectors. Differential tests must compare on-chain results with the reference model.

### 14.4 Position representation

Choose one position ownership model through ADR:
- ERC-721 position token.
- ERC-1155 or another representation, if justified.
- Non-transferable account model.

If NFT positions are used, define:
- Mint/burn authority.
- Position owner and approval behavior.
- Metadata policy.
- Transfer semantics.
- Increase/decrease liquidity.
- Fee collection.
- Position closure.
- Safe transfer behavior.
- Reentrancy considerations around callbacks.
- Indexer reconstruction.

## 15. EVM v4-inspired singleton architecture

This is a major independent workstream. “Inspired by v4” must not be represented as official Uniswap v4 compatibility unless exact compatibility has been proven and approved.

### 15.1 Architecture elements to specify

- Singleton `PoolManager`-style contract holding multiple pools.
- Pool key and pool ID derivation.
- Currency ordering and validation.
- Fee configuration, including static and approved dynamic fee modes.
- Tick spacing and pool initialization.
- Hook address/configuration and permission model.
- Unlock/lock execution boundary.
- Transient accounting using the supported EVM transient-storage mechanism where available and appropriate.
- Per-currency delta accounting.
- Settlement and take operations.
- Flash accounting invariants.
- Swap, liquidity modification, donation, and initialization flows.
- Protocol fee accounting.
- Native currency handling.
- Reentrancy and callback boundaries.
- Pool-level and global pause behavior.

### 15.2 Flash accounting requirements

The implementation must formally specify:
- How a caller enters an unlocked execution window.
- Which actions may occur during the window.
- How currency deltas are tracked.
- How positive and negative deltas are settled.
- What constitutes a balanced final state.
- Which accounts/callers can settle or take assets.
- How nested calls are prevented or safely handled.
- How a failed operation reverts the entire accounting context.
- How transient state is cleared by transaction completion.
- How tokens with unusual transfer behavior are handled.

**Invariant:** no successful unlock/settlement sequence may leave an unpaid negative currency delta or create an unauthorized withdrawal.

### 15.3 Hook system requirements

Hooks are arbitrary code execution boundaries and must be treated as high risk.

Define:
- Hook permissions and immutable permission configuration.
- Supported callback points.
- Callback input and output formats.
- Gas limits and failure semantics.
- Reentrancy policy.
- Pool creation eligibility.
- Hook allowlist/approval process.
- Fee bounds and disclosure.
- Upgradeability policy for hooks.
- Monitoring and emergency disable behavior.
- Compatibility rules across pool versions.

Release 1 must not expose unrestricted permissionless hooks with user funds. Begin with no hooks or a tightly controlled allowlist of reviewed hooks. Each hook requires an independent threat model and audit.

### 15.4 Dynamic fee and custom accounting

Specify:
- Who may set the fee.
- Fee bounds.
- Update timing.
- Fee calculation inputs.
- Manipulation resistance.
- Rounding and fee allocation.
- LP fee, protocol fee, and hook fee separation.
- User-visible quote disclosure.
- Failure behavior if a fee hook reverts or returns invalid data.

### 15.5 Native currency support

Specify native currency wrap/unwrap behavior, settlement, refunds, failed calls, and router integration. Do not assume all EVM chains have identical native currency semantics.

## 16. EVM periphery and position manager

Required modules, subject to the selected pool architecture:

- Pool creation / initialization manager.
- Position manager.
- Swap router.
- Quoter / quote simulation contract if needed.
- Permit/approval integration.
- Multicall or batched operation support.
- Native currency wrapper integration.
- Fee collection interface.
- Optional migration helpers.

Every periphery contract must have a narrow responsibility and documented trust assumptions.

## 17. Permit2-style approvals and token authorization

Permit2 is an integration choice, not a feature to reimplement casually.

The ADR must decide whether to:
- Integrate an existing reviewed Permit2 deployment where available.
- Use standard ERC-20 approvals only.
- Implement a constrained protocol-specific authorization mechanism.

If a signature-based approval system is implemented, specify:
- Domain separation.
- Chain and contract binding.
- Nonce model.
- Deadline.
- Token and spender scope.
- Amount limits.
- Signature validation.
- Replay protection.
- Revocation and expiration.
- Smart-contract wallet compatibility.
- Signature malleability handling.
- Frontend human-readable signing explanation.

Never ask users to sign opaque or unexplained messages. Do not build a custom signature system without specialist review.

## 18. EVM universal-router-inspired command engine

A command router may compose swaps, wrapping, unwrapping, Permit2 transfers, and position operations. It is not automatically safe because it uses a command byte.

Before implementation define:
- Command grammar and versioning.
- Allowed commands.
- Argument encoding.
- Input/output token accounting.
- Maximum command count and calldata size.
- Recipient validation.
- Deadline and slippage constraints.
- Partial-fill semantics.
- Subplan recursion/depth limits.
- Balance checks.
- Refund handling.
- Native currency handling.
- Failure and revert policy.
- Reentrancy protection.
- Authorization scope.
- Event and trace observability.

Do not include arbitrary external-call commands in the initial release. Every command must have a dedicated threat model and tests.

## 19. EVM smart order routing

The quote engine must model:
- Direct pools.
- Multi-hop paths.
- Multiple pool types.
- Multiple fee tiers.
- Split routes.
- Gas-adjusted output.
- Price impact.
- Slippage.
- Liquidity and pool health.
- Token compatibility restrictions.
- Route execution constraints.
- Quote expiration and state freshness.

The route search algorithm must:
- Have deterministic bounds on hop count, candidate pools, and search time.
- Avoid cycles unless explicitly supported and proven useful.
- Avoid unsupported tokens/pools.
- Account for per-hop fees and price impact.
- Use integer math.
- Compare routes by a documented objective function.
- Report estimated network cost separately from swap price.
- Support simulation before transaction submission.

Partial fills are deferred unless the execution model can prove safe handling of unspent input and minimum output. Split routes must be tested for rounding and aggregate slippage.

---

# Part VI — Solana protocol engineering

## 20. Solana architecture overview

Solana must be implemented natively around its account model, transaction model, runtime constraints, and token programs. Do not port EVM singleton/flash-accounting assumptions directly.

The Solana workstream must specify:
- Program boundaries and instruction interfaces.
- PDA seeds and bump strategy.
- Account ownership and mutability.
- Signer requirements.
- Account validation.
- Rent and account lifecycle.
- Token program compatibility.
- CPI boundaries.
- Compute-unit budget.
- Transaction size and account-count limits.
- Address Lookup Table use where appropriate.
- Account contention and parallelism.
- Program upgrade authority policy.
- Event/logging strategy.
- Client account derivation.

## 21. Solana AMM program

### 21.1 Core account model

At minimum, specify and version:
- Global/config account.
- Pool state account.
- Pool authority PDA.
- Token vault accounts.
- LP token mint or position account model.
- Fee configuration account.
- Optional observation/oracle accounts.
- Admin/authority account.
- Token program references.

Each account schema must document:
- Discriminator/version.
- Field order and types.
- Serialization format.
- PDA seeds.
- Owner program.
- Required signer.
- Writable/read-only status.
- Initialization and closure rules.
- Migration behavior.

### 21.2 Required instructions

- Initialize global config.
- Create pool.
- Initialize pool vaults.
- Add liquidity.
- Remove liquidity.
- Swap exact input.
- Swap exact output if supported.
- Update permitted configuration.
- Collect protocol fees if enabled.
- Close eligible empty accounts if safe.

### 21.3 Validation requirements

Every instruction must validate:
- Program IDs.
- Account owners.
- PDA derivations and bumps.
- Mint addresses.
- Token program IDs.
- Vault authority.
- Token account mint and authority.
- Signer identity and role.
- Pool status.
- Fee bounds.
- Amount bounds.
- Slippage and deadline/slot constraints.
- Account relationships.
- Duplicate or aliased accounts where unsafe.

Never trust client-supplied account relationships without deriving and validating them on-chain.

## 22. Solana concentrated-liquidity AMM

This is a separate specification and implementation.

Required concepts:
- Pool state and sqrt price.
- Tick spacing and tick arrays.
- Tick initialization.
- Active liquidity.
- Position ownership/account model.
- Position boundaries.
- Swap steps and tick crossing.
- Fee growth global and inside position.
- Liquidity net changes.
- Fee collection.
- Position close lifecycle.
- Observation/oracle design if required.
- Compute and account access bounds.

### 22.1 Tick-array design

Define:
- Tick-array size.
- PDA derivation.
- Tick index mapping.
- Initialization rules.
- Boundary-crossing behavior.
- Required account ordering.
- Maximum arrays per swap.
- Missing-array error behavior.
- Account-lock and transaction-size implications.

### 22.2 Position model

Choose an explicit position model:
- PDA-backed position account.
- Tokenized position.
- Another reviewed design.

Specify ownership, transferability, delegation, close conditions, fee collection, and indexer reconstruction. Do not assume EVM ERC-721 semantics apply to Solana.

## 23. Solana router and transaction composition

Required capabilities:
- Route quote.
- Instruction construction.
- Account resolution.
- Transaction simulation.
- Compute-budget instruction planning.
- Priority fee estimate and disclosure.
- Address Lookup Table support when needed.
- Atomic multi-hop execution where possible.
- Minimum output enforcement.
- Transaction expiry/blockhash handling.
- Confirmation/finality tracking.
- Retry policy that avoids duplicate user actions.

A Solana transaction can fail because of account locks, compute limits, account count, transaction size, stale blockhash, or program errors. Surface useful error categories and do not label all failures as generic “swap failed”.

### 23.1 Token-2022

Support only explicitly reviewed extensions. Transfer hooks and transfer fees introduce additional account and amount semantics. The quote engine, router, pool program, indexer, and UI must all agree on the supported extension policy.

---

# Part VII — Shared trading, SDK, API, and frontend

## 24. Unified SDK design

The unified SDK must be a facade over distinct chain-specific SDKs, not a false abstraction that hides important differences.

Suggested packages:
- `sdk-evm`
- `sdk-solana`
- `sdk-unified`

The unified layer must use discriminated unions and explicit chain-specific transaction results.

### 24.1 SDK capabilities

- Network registry access.
- Token metadata and risk status.
- Pool discovery.
- Pool state reads.
- Quote exact input/output.
- Route discovery.
- Price impact and fee breakdown.
- Transaction/instruction construction.
- Approval/authorization workflow.
- Simulation.
- Submission.
- Confirmation/finality tracking.
- Liquidity position reads.
- Add/remove liquidity.
- Fee collection.
- Transaction history.

### 24.2 SDK quality requirements

- Strict TypeScript types.
- No floating-point accounting.
- Runtime validation of untrusted API data.
- Explicit errors and error codes.
- Abort/cancellation support for reads.
- Configurable RPC clients.
- No embedded private keys.
- No hidden transaction submission.
- Versioned public API.
- Unit and integration tests.
- Examples for both chains.

## 25. API design

Use a versioned API such as `/api/v1`. Exact framework and transport are ADR decisions.

Suggested read endpoints:

```text
GET  /api/v1/networks
GET  /api/v1/tokens?network=
GET  /api/v1/tokens/{network}/{asset}
GET  /api/v1/pools?network=&type=&token0=&token1=
GET  /api/v1/pools/{network}/{poolId}
GET  /api/v1/pools/{network}/{poolId}/liquidity
GET  /api/v1/quotes?network=&tokenIn=&tokenOut=&amountIn=
GET  /api/v1/routes?network=&tokenIn=&tokenOut=&amountIn=
GET  /api/v1/positions?network=&owner=
GET  /api/v1/positions/{network}/{positionId}
GET  /api/v1/transactions/{network}/{txId}
GET  /api/v1/analytics/overview?network=
GET  /api/v1/analytics/pools/{network}/{poolId}
GET  /api/v1/health
```

Suggested transaction preparation endpoints, if a backend is needed:

```text
POST /api/v1/swap/prepare
POST /api/v1/liquidity/add/prepare
POST /api/v1/liquidity/remove/prepare
POST /api/v1/positions/collect/prepare
POST /api/v1/transactions/simulate
```

The API must not custody funds or sign transactions for users. The wallet signs user transactions.

### 25.1 API contract rules

- Publish OpenAPI specification.
- Validate request and response schemas.
- Use decimal integer strings for raw amounts.
- Include network and asset namespace in every identifier.
- Return quote timestamp, block/slot context, expiry, and freshness.
- Include route hops and per-hop fee details.
- Include expected output, minimum output, price impact, and estimated network cost separately.
- Use stable error codes.
- Rate-limit expensive quote and history endpoints.
- Enforce request size and timeout limits.
- Never trust a client-supplied price or token metadata.
- Avoid leaking RPC credentials or internal infrastructure details.

## 26. Frontend requirements

### 26.1 Main pages

- Swap.
- Explore pools.
- Pool details.
- Add liquidity.
- Remove liquidity.
- Position portfolio.
- Transaction history.
- Token details and risk warnings.
- Network selection.
- Documentation/help.
- Status page.
- Restricted admin/operations page only if required.

### 26.2 Swap screen

Must show:
- Connected wallet and selected network.
- Input token and amount.
- Output token and estimated amount.
- Route and each hop.
- Pool fee(s).
- LP/protocol/hook fees where applicable.
- Price impact.
- Minimum received.
- Slippage setting.
- Quote age/expiry.
- Estimated gas or Solana compute/priority fee.
- Token risk warnings.
- Approval/authorization state.
- Simulation result.
- Clear final transaction confirmation.

Do not use misleading “guaranteed output” language for a quote.

### 26.3 Liquidity screens

For constant-product pools:
- Deposit ratio.
- Estimated LP share.
- Pool share.
- Fee tier.
- Position or LP token balance.

For concentrated liquidity:
- Price range.
- Current price.
- In-range/out-of-range status.
- Token amounts required.
- Estimated position liquidity.
- Fee accrual and collectable fees.
- Range adjustment workflow.
- Clear warning that out-of-range liquidity may not earn swap fees.

### 26.4 UX and accessibility

- Responsive design.
- Keyboard navigation.
- Screen-reader labels.
- Color contrast.
- Clear pending/success/failure states.
- No false success before chain confirmation.
- Distinguish submitted, confirmed, and finalized.
- Human-readable wallet signing prompts.
- Prevent accidental chain mismatch.
- Warn before high price impact or suspicious token interactions.
- Never hide fees or route details.

---

# Part VIII — Indexing, storage, and data integrity

## 27. Indexer architecture

Build separate chain-specific indexers:

- EVM event indexer.
- Solana account/event indexer.

They may publish normalized domain events, but source-specific metadata must remain available.

### 27.1 EVM indexer

Must handle:
- Block scanning.
- Event decoding by contract version.
- Confirmation/finality policy.
- Reorg detection.
- Rollback to a canonical checkpoint.
- Idempotent event processing.
- Backfill.
- Contract deployment/version registry.
- Missing log detection.
- RPC provider failover.
- Reconciliation against on-chain state.

### 27.2 Solana indexer

Must handle:
- Signature and slot scanning.
- Program logs and account changes.
- Commitment/finality policy.
- Fork/rollback handling according to cluster semantics.
- Transaction parsing by program version.
- Account snapshot and event reconciliation.
- Backfill and checkpointing.
- RPC provider failover.
- Missing transaction detection.

### 27.3 Canonical event envelope

Suggested normalized event fields:

```json
{
  "schemaVersion": 1,
  "network": {
    "namespace": "eip155",
    "reference": "configured-network-key"
  },
  "source": {
    "kind": "evm-log-or-solana-instruction",
    "programOrContract": "chain-address",
    "transactionId": "chain-transaction-id",
    "blockOrSlot": "integer-string",
    "eventIndex": "integer-string"
  },
  "eventType": "PoolCreated",
  "eventTime": "observed-timestamp",
  "finality": "pending|confirmed|finalized",
  "payload": {}
}
```

Do not use the example placeholders as real deployment configuration.

### 27.4 Database schema

Use migrations and explicit constraints. Proposed logical tables:

- `networks`
- `protocol_deployments`
- `tokens`
- `token_risk_reviews`
- `pools`
- `pool_snapshots`
- `swaps`
- `liquidity_positions`
- `position_events`
- `transactions`
- `chain_events`
- `indexer_checkpoints`
- `indexer_reorgs`
- `quotes` (short retention, optional)
- `api_rate_limit_buckets` (if DB-backed)
- `audit_log` (for operator actions)

Every chain-derived row must include network identity and source transaction/event identity. Use unique constraints to enforce idempotency.

### 27.5 Data truth hierarchy

1. On-chain canonical state is protocol truth.
2. Finalized chain events are evidence for indexer state.
3. PostgreSQL is a query/indexing projection.
4. Redis is disposable cache.
5. Frontend state is not authoritative.

### 27.6 Reconciliation

Implement scheduled reconciliation:
- Compare indexed pool state with on-chain reads.
- Compare vault balances with accounting expectations.
- Detect missing or duplicated events.
- Detect indexer lag and checkpoint gaps.
- Record discrepancies.
- Alert on material mismatch.
- Provide safe replay and rebuild procedures.

Never silently patch indexed financial values without preserving source evidence.

---

# Part IX — Security, testing, and assurance

## 28. Threat model

Create a formal threat model before implementation and update it whenever trust boundaries change.

### 28.1 Assets to protect

- User token balances.
- Pool reserves and vault balances.
- LP positions and accrued fees.
- Protocol fee balances.
- Admin and upgrade authority.
- Signatures and authorization nonces.
- Token registry integrity.
- Price/observation data.
- API and indexer integrity.
- Deployment artifacts and release keys.

### 28.2 Threat actors

- Malicious trader.
- Malicious token issuer.
- Malicious liquidity provider.
- Malicious hook developer.
- Compromised RPC provider.
- Compromised indexer/API operator.
- Compromised admin signer.
- MEV/searcher or transaction reordering actor.
- Frontend supply-chain attacker.
- Malicious dependency maintainer.
- Insider with excessive privileges.

### 28.3 Required attack analysis

Analyze at least:
- Reentrancy.
- Arithmetic overflow/underflow.
- Rounding and dust extraction.
- Incorrect fee accounting.
- Pool initialization manipulation.
- Price manipulation and sandwiching.
- Flash-loan-assisted manipulation.
- Oracle manipulation if oracles are used.
- Donation/balance-reserve mismatch.
- Token behavior incompatibility.
- Malicious hooks and callback abuse.
- Unauthorized pool or config changes.
- Signature replay and nonce errors.
- Approval phishing and excessive allowance.
- Router recipient/input/output confusion.
- Partial-fill refund errors.
- Denial of service and gas/compute exhaustion.
- Solana account substitution and PDA validation failures.
- CPI privilege escalation.
- Account aliasing.
- Program upgrade authority compromise.
- Reorg/finality/indexer inconsistency.
- API quote staleness and route manipulation.
- Frontend dependency or build compromise.
- Admin key loss or compromise.

### 28.4 Security controls

- Least privilege.
- Multisig for sensitive administration.
- Timelock for non-emergency changes where appropriate.
- Separate deployer, admin, guardian, and fee-recipient roles.
- No production private keys in CI.
- Hardware-backed or managed signing for production.
- Narrowly scoped pause controls.
- Transparent fee configuration.
- Dependency pinning and scanning.
- Reproducible builds.
- Signed release artifacts.
- Static analysis.
- Fuzzing and invariant testing.
- Independent audits.
- Public vulnerability disclosure process.
- Incident response plan.

## 29. Testing strategy

Testing is a release requirement, not a final polish step.

### 29.1 Unit tests

- Every math function.
- Every state transition.
- Every access-control rule.
- Every validation branch.
- Every error condition.
- Every fee calculation.
- Every rounding boundary.
- Every token compatibility case.

### 29.2 Property and invariant tests

EVM examples:
- Pool balances and accounting remain consistent.
- No user can withdraw more than entitled.
- Total liquidity accounting is conserved under valid operations.
- Fees accrue to the correct positions.
- Unauthorized callers cannot change protected configuration.
- Flash accounting ends with all deltas settled.
- Router cannot deliver below the enforced minimum output.
- Position ownership and liquidity accounting remain consistent.

Solana examples:
- Only valid PDA authorities control vaults.
- Pool vault mint/authority relationships remain valid.
- No instruction can debit a vault beyond authorized accounting.
- Position liquidity and fee accounting remain consistent.
- Invalid account substitutions always fail.
- Required signer and owner constraints are enforced.
- CPI cannot exceed intended authority.
- Account close operations cannot destroy non-empty or valuable state.

The exact mathematical invariants must be formally written for each pool model before coding.

### 29.3 Fuzz testing

Fuzz:
- Token amounts near zero and maximum values.
- Prices near tick boundaries.
- Liquidity near minimum/maximum.
- Fee values at every allowed boundary.
- Repeated add/remove/swap sequences.
- Multiple positions with overlapping ranges.
- Malformed calldata/instruction accounts.
- Router command sequences.
- Hook callback return values.
- Nonce and deadline boundaries.

### 29.4 Differential testing

Compare:
- On-chain math with a high-precision reference model.
- Quote engine with contract/program simulation.
- EVM implementation with approved known reference vectors where license and compatibility permit.
- Solana implementation with its independent Rust reference model.
- Indexer projections with direct chain reads.

Do not assume an external protocol is the correct oracle for a deliberately different design.

### 29.5 Integration and end-to-end tests

- Wallet connection and network switching.
- Token discovery.
- Approval/authorization.
- Quote and route refresh.
- Swap simulation and submission.
- Transaction confirmation/finality.
- Add/remove liquidity.
- Position fee collection.
- Indexer update.
- Reorg/fork recovery.
- RPC outage and failover.
- API rate limiting.
- Frontend handling of rejected wallet signatures.
- User rejection and transaction replacement.

### 29.6 Load and resilience tests

- Quote API throughput.
- Pool discovery latency.
- Indexer throughput and lag.
- Database query performance.
- Cache failure.
- RPC degradation.
- Queue backlog.
- Worker restart and replay.
- Horizontal scaling behavior.
- Resource exhaustion.

### 29.7 Required test evidence

For every release candidate, store:
- Commit hash.
- Toolchain versions.
- Test commands.
- Test output.
- Coverage report.
- Fuzz run duration and seed corpus.
- Invariant test results.
- Static-analysis reports.
- Known exclusions and reasons.
- Build artifact hashes.

Coverage percentages are useful indicators, not proof of security. Critical accounting and authorization paths require explicit tests even if overall coverage is high.

## 30. Independent security review and audit

Before mainnet or real-value deployment:
- Independent EVM contract audit.
- Independent Solana program audit.
- Review of router, hooks, approvals, and position manager.
- Economic attack and market-risk review.
- Backend/API/indexer security review.
- Frontend and supply-chain review.
- Infrastructure and key-management review.
- Remediation of all critical/high findings.
- Re-test and auditor confirmation for material fixes.
- Public audit report or an approved disclosure policy.

No audit can prove absolute safety. The release decision must consider residual risk and explicitly accept it.

---

# Part X — Backend operations and infrastructure

## 31. Backend service responsibilities

Keep services stateless where practical.

- API/BFF: request validation, rate limits, response composition.
- Quote service: route search, quote calculation, freshness.
- Chain readers: RPC reads and simulation.
- EVM indexer: event ingestion and reorg management.
- Solana indexer: slot/signature/account ingestion.
- Reconciliation worker: indexed/on-chain comparison.
- Notification worker: transaction status and operational notices.
- Metadata service: curated token and pool metadata.

Do not let backend services custody user funds or hold user signing keys.

## 32. RPC resilience

- Configure multiple providers where practical.
- Define provider trust and data consistency assumptions.
- Use timeouts, bounded retries, circuit breakers, and backoff.
- Detect stale heads/slots and unhealthy endpoints.
- Do not treat a provider response as canonical without chain/finality checks.
- Record provider and request context for debugging.
- Avoid retrying non-idempotent actions blindly.
- Keep RPC credentials in secret storage.
- Test provider outage and inconsistent responses.

## 33. Observability

### Metrics

Protocol-facing:
- Swap count and volume.
- Pool TVL and liquidity.
- Fee accrual.
- Failed swap rate.
- Price impact distribution.
- Route quote latency.
- Simulation failure rate.

System-facing:
- API request rate, latency, and errors.
- RPC latency and error rate.
- Indexer lag.
- Reconciliation mismatch count.
- Worker queue depth.
- Database pool saturation.
- Cache hit ratio.
- CPU, memory, disk, and network.
- Deployment version and uptime.

Security-facing:
- Pause events.
- Admin role changes.
- Hook registration/activation.
- Fee configuration changes.
- Unusual vault balance changes.
- Failed authorization attempts.
- Reconciliation discrepancies.

Do not put private keys, signatures, full sensitive user data, or credentials in logs.

### Alerts

Define severity, owner, and response time for:
- Protocol invariant violation.
- Unexpected vault balance change.
- Indexer reconciliation mismatch.
- Critical RPC outage.
- API outage.
- High transaction failure rate.
- Admin/upgrade authority change.
- Suspicious hook behavior.
- Database or queue failure.
- Security incident.

## 34. Deployment and infrastructure

Start with local development and test environments. Production infrastructure must be justified by load and reliability requirements.

Required:
- Infrastructure-as-code where appropriate.
- Separate dev, staging, and production environments.
- Network isolation and least-privilege service identities.
- Secret manager.
- TLS and secure headers.
- Database backups and restore tests.
- Migration plan.
- Log retention and access controls.
- Monitoring and alerting.
- Artifact registry and image scanning.
- Signed deployment artifacts.
- Roll-forward and rollback procedures.
- Disaster recovery runbook.

Do not introduce Kubernetes merely for appearance. If Kubernetes is selected, specify:
- Cluster ownership and upgrades.
- Network policies.
- Pod security.
- Resource requests/limits.
- Liveness/readiness probes.
- Secret integration.
- Autoscaling rules.
- Persistent volume and backup strategy.
- Ingress and TLS.
- Disaster recovery.
- Cost and operational ownership.

## 35. Key and authority management

Define separate roles:
- Deployer.
- Protocol administrator.
- Guardian/pause authority.
- Fee recipient.
- Upgrade authority, if any.
- Token registry operator.
- Monitoring/read-only operator.

Requirements:
- Multisig or managed threshold signing for sensitive roles.
- No shared personal keys.
- No seed phrases in environment files or chat.
- Rotation and recovery procedures.
- Role change monitoring.
- Timelock for high-impact configuration changes where feasible.
- Documented emergency authority and abuse controls.
- Test recovery process in a non-production environment.

For Solana, document upgrade authority and program-data account control. For EVM, document ownership, proxy admin, timelock, and implementation immutability separately.

---

# Part XI — Release engineering

## 36. Environments

### Local
- Local EVM node.
- Local Solana validator.
- Deterministic fixtures.
- Mock or controlled token contracts/mints.
- Local database and cache.
- Reproducible scripts.

### Testnet / devnet
- Explicitly selected networks.
- Test tokens only.
- Test deployment registry.
- Monitoring enabled.
- Full user journey tests.
- No real funds.

### Production
- Only after release approval.
- Verified artifacts and deployment addresses.
- Audited code hash.
- Operational on-call.
- Monitoring and incident response.
- Controlled initial limits.
- Public status and documentation.

## 37. Deployment sequence

Exact order depends on the selected architecture, but deployment scripts must be deterministic and idempotent.

For each chain:
1. Verify network identity and chain/cluster configuration.
2. Verify compiler/toolchain and artifact hashes.
3. Deploy or initialize configuration.
4. Deploy core pool engine/program.
5. Deploy factory/registry or initialize global config.
6. Deploy periphery/router/position manager as applicable.
7. Configure only approved roles and fee settings.
8. Verify contract code or program deployment and authority.
9. Run post-deployment read-only checks.
10. Run small controlled test transactions only on approved test environments.
11. Register deployment metadata in the versioned registry.
12. Enable frontend features only after health checks pass.

Never paste fabricated addresses into configuration. Deployment outputs must be captured and reviewed.

## 38. Release gates

A release cannot advance unless all applicable gates pass:

**Gate A — Specification**
- Requirements approved.
- ADRs accepted.
- Math and accounting specs reviewed.
- Threat model reviewed.

**Gate B — Engineering**
- Code review complete.
- CI green.
- Unit/integration/invariant tests green.
- Static analysis reviewed.
- Reproducible build confirmed.

**Gate C — Test environment**
- Full end-to-end flows pass.
- Indexer reconciliation passes.
- RPC failure and recovery tests pass.
- Monitoring and runbooks verified.

**Gate D — Security**
- Independent audits completed.
- Critical/high issues fixed and re-tested.
- Economic risk review complete.
- Key custody reviewed.
- Residual risks documented and accepted.

**Gate E — Production authorization**
- Deployment plan approved.
- Exact chain and addresses verified.
- Signers and roles verified.
- Monitoring/on-call active.
- Incident and pause procedures rehearsed.
- Explicit project-owner authorization recorded.

If any gate fails, release is blocked.

## 39. Incident response

Prepare runbooks for:
- Suspected contract/program exploit.
- Unexpected pool/vault balance movement.
- Malicious token or hook.
- Admin key compromise.
- Upgrade authority compromise.
- RPC provider compromise or outage.
- Indexer corruption or lag.
- Frontend compromise.
- Database loss.
- Deployment error.

Each runbook must define:
- Detection signals.
- Decision owner.
- Safe containment options.
- Whether and how to pause.
- Communication plan.
- Evidence preservation.
- Recovery constraints.
- Post-incident review.

A pause mechanism must not be described as a universal recovery mechanism. Some on-chain actions may be irreversible.

---

# Part XII — Detailed delivery phases

## 40. Phase 0 — Product discovery and decisions

**Deliverables**
- Product requirements.
- Chain selection ADR.
- Token compatibility policy.
- Release scope.
- Fee/economic policy draft.
- Threat model v1.
- Success metrics.
- Staffing and dependency assumptions.

**Exit criteria**
- No unresolved decision blocks the first implementation slice.
- Out-of-scope items are documented.
- Project owner approves the scope.

## 41. Phase 1 — Protocol mathematics and specifications

**Deliverables**
- V2 math specification if included.
- CLMM math specification.
- EVM v4-inspired singleton specification if approved.
- Solana AMM account/instruction specification.
- Solana CLMM tick-array and position specification.
- Fee and rounding policy.
- Token compatibility specification.
- State transition diagrams.
- Threat model updated.

**Exit criteria**
- Independent technical review of formulas and invariants.
- Reference models and test vectors exist.
- All state variables and authority boundaries are documented.

## 42. Phase 2 — Repository and CI foundation

**Deliverables**
- Repository skeleton.
- Pinned toolchains.
- Formatting and linting.
- Unit test runners.
- Static analysis.
- Dependency scanning.
- Secret scanning.
- Build artifact hashing.
- PR template and code ownership.
- Local development environment.

**Exit criteria**
- Clean checkout can reproduce builds and tests.
- CI fails on formatting, test, or security scan failures according to policy.

## 43. Phase 3 — Shared domain, network registry, and token policy

**Deliverables**
- Typed network registry.
- Asset identity model.
- Amount utilities using integer arithmetic.
- Token metadata schema.
- Token risk classification.
- API schema baseline.
- Chain-specific error taxonomy.

**Exit criteria**
- No symbol-only asset identity.
- No floating-point token accounting.
- Unsupported token behavior is rejected or explicitly surfaced.

## 44. Phase 4 — EVM V2 reference AMM

**Deliverables**
- Factory/registry.
- Pair/pool.
- Router.
- Quote model.
- Tests and invariants.
- Deployment scripts for local/test environment.
- Documentation.

**Exit criteria**
- All V2 requirements and security tests pass.
- Math differential tests pass.
- No mainnet deployment.

If V2 is not a product requirement, document the decision and defer it.

## 45. Phase 5 — EVM concentrated liquidity

**Deliverables**
- Pool core.
- Tick math.
- Tick bitmap/indexing.
- Position accounting.
- Swap engine.
- Fee growth.
- Position manager.
- Router integration.
- Reference model and differential tests.

**Exit criteria**
- All CLMM invariants pass under fuzzing.
- Tick boundary and fee accounting tests pass.
- Independent code review completed.

## 46. Phase 6 — EVM v4-inspired singleton engine

**Deliverables**
- Pool manager.
- Pool identity/key logic.
- Unlock and flash accounting.
- Settlement/take.
- Dynamic fee framework, if approved.
- Hook permission framework, if approved.
- Native currency handling.
- Position manager integration.
- Router integration.

**Exit criteria**
- Formal accounting invariants pass.
- Hook system is disabled or restricted to reviewed hooks.
- Reentrancy, callback, and settlement attack tests pass.
- Independent specialist review completed.

This phase may be deferred if it threatens the delivery or security of the core DEX. Do not rush it.

## 47. Phase 7 — Solana native AMM

**Deliverables**
- Program architecture.
- Config and pool accounts.
- Vault authority PDAs.
- Initialization instructions.
- Add/remove liquidity.
- Swap instructions.
- Token program policy.
- Anchor/Rust tests.
- Client SDK.

**Exit criteria**
- Account validation tests pass.
- PDA and vault invariants pass.
- Compute and transaction-size budgets are measured.
- Local validator and devnet flows pass.

## 48. Phase 8 — Solana concentrated liquidity

**Deliverables**
- CLMM math.
- Tick arrays.
- Position accounts.
- Swap and tick crossing.
- Fee accounting.
- Account-resolution client.
- Compute optimization.
- Fuzz and differential tests.

**Exit criteria**
- Position and vault invariants pass.
- Tick-array boundaries pass.
- Account-lock and transaction-size behavior documented.
- Independent Solana review completed.

## 49. Phase 9 — Router, quotes, and transaction simulation

**Deliverables**
- Chain-specific routers or instruction builders.
- Unified route representation.
- Bounded route search.
- Split routing if approved.
- Fee and price-impact calculation.
- Simulation.
- Slippage enforcement.
- Quote freshness and expiry.
- Error mapping.

**Exit criteria**
- Quote and execution results agree within defined rounding bounds.
- Routes never use unsupported pools/tokens.
- Gas/compute estimates are labeled as estimates.
- Failure and refund behavior is tested.

## 50. Phase 10 — SDK and API

**Deliverables**
- EVM SDK.
- Solana SDK.
- Unified facade.
- OpenAPI contract.
- API implementation.
- Rate limits.
- Typed errors.
- Examples and developer documentation.

**Exit criteria**
- SDK examples run against test environments.
- API schema tests pass.
- No secret or signing key is required by public API.

## 51. Phase 11 — Indexers and data platform

**Deliverables**
- EVM indexer.
- Solana indexer.
- Database migrations.
- Canonical event schema.
- Reorg/fork recovery.
- Backfill.
- Reconciliation worker.
- Analytics queries.

**Exit criteria**
- Rebuild from checkpoint works.
- Duplicate processing is idempotent.
- Reconciliation detects injected inconsistencies.
- Indexer outage recovery is demonstrated.

## 52. Phase 12 — Frontend

**Deliverables**
- Wallet connection.
- Network selection.
- Swap.
- Pool discovery.
- Liquidity add/remove.
- Position portfolio.
- Transaction status.
- Risk warnings.
- Accessibility and responsive behavior.

**Exit criteria**
- End-to-end user journeys pass on each supported chain.
- No false confirmation state.
- Wallet rejection, stale quote, network mismatch, and failed transaction states are tested.

## 53. Phase 13 — Operations and production hardening

**Deliverables**
- Monitoring dashboards.
- Alerts.
- Runbooks.
- Secret management.
- Backup/restore.
- RPC failover.
- Deployment automation.
- Reconciliation.
- Load and resilience reports.
- Incident rehearsal.

**Exit criteria**
- Operators can identify and respond to critical alerts.
- Recovery procedures have been tested.
- No unresolved critical operational risks.

## 54. Phase 14 — Independent audit and remediation

**Deliverables**
- Audit scope and code freeze.
- Auditor reports.
- Finding register.
- Remediation PRs.
- Retest evidence.
- Residual risk register.

**Exit criteria**
- No unresolved critical/high findings.
- Material fixes are reviewed and re-tested.
- Release owner formally accepts residual risk.

## 55. Phase 15 — Controlled release

**Deliverables**
- Final deployment manifests.
- Verified code/program hashes.
- Deployment addresses and program IDs.
- Role and signer verification.
- Feature flags.
- Monitoring and status page.
- Release notes.
- Rollback/containment plan.

**Exit criteria**
- All release gates pass.
- Explicit project-owner authorization exists.
- Initial limits and monitoring are active.

## 56. Later phases — separate product programs

Lending, governance, yield products, bridge, and advanced trading must each begin with new discovery and threat-model phases. They are not automatic continuations of the DEX release.

---

# Part XIII — Acceptance criteria and traceability

## 57. Core DEX acceptance checklist

### Protocol
- [ ] Pool identity is deterministic and unambiguous.
- [ ] Token ordering and decimals are validated.
- [ ] Fee configuration is bounded and documented.
- [ ] Swap math is covered by reference vectors.
- [ ] Liquidity accounting is conserved.
- [ ] Fee accounting is position-correct.
- [ ] Rounding and dust policy is explicit.
- [ ] Unsupported token behaviors are rejected.
- [ ] Unauthorized configuration changes fail.
- [ ] Pause behavior is tested and documented.

### EVM
- [ ] Compiler and optimizer settings are pinned.
- [ ] Storage and upgradeability policy is documented.
- [ ] Reentrancy and external calls are reviewed.
- [ ] Permit/approval behavior is tested.
- [ ] Router commands are bounded and validated.
- [ ] Flash accounting settles all deltas.
- [ ] Hook permissions are immutable or securely controlled.
- [ ] Native currency flows and refunds are tested.
- [ ] Deployment and verification are reproducible.

### Solana
- [ ] Every account owner is checked.
- [ ] Every PDA is derived and validated.
- [ ] Signer and writable privileges are minimal.
- [ ] Vault mint and authority are validated.
- [ ] Token program and extension policy is enforced.
- [ ] CPI boundaries are reviewed.
- [ ] Compute and transaction size are measured.
- [ ] Account lifecycle and rent behavior are tested.
- [ ] Upgrade authority policy is documented.

### Trading
- [ ] Quotes include block/slot context and expiry.
- [ ] Price impact and fees are transparent.
- [ ] Slippage/minimum output is enforced on-chain.
- [ ] Route search is bounded.
- [ ] Unsupported assets/pools are excluded.
- [ ] Simulation failures are surfaced.
- [ ] Partial-fill/refund behavior is tested if enabled.

### Backend and data
- [ ] Indexers are idempotent.
- [ ] Reorg/fork recovery works.
- [ ] Checkpoints and backfills work.
- [ ] Reconciliation detects state mismatches.
- [ ] Database migrations are reversible or have a documented forward-recovery plan.
- [ ] Cache can be discarded and rebuilt.
- [ ] API schemas and errors are versioned.

### Frontend
- [ ] Wallet/network mismatch is handled.
- [ ] Token risk warnings are visible.
- [ ] User sees fees, route, price impact, and minimum output.
- [ ] Wallet signature is user-controlled.
- [ ] Submitted/confirmed/finalized states are distinct.
- [ ] Rejected and failed transactions are handled.
- [ ] Accessibility and responsive tests pass.

### Operations and security
- [ ] Monitoring and alerts are active.
- [ ] Key custody and role separation are reviewed.
- [ ] Backups and restore are tested.
- [ ] Incident runbooks are rehearsed.
- [ ] Independent audits are complete.
- [ ] Critical/high findings are remediated.
- [ ] Release approval is recorded.

## 58. Requirements traceability matrix

Maintain `docs/requirements-traceability.csv` with columns:

```text
requirement_id,requirement,design_doc,adr,implementation_paths,test_paths,security_review,status,evidence
```

Every requirement in this plan must map to:
- Design artifact.
- Implementation path(s).
- Test path(s).
- Security review where relevant.
- Current status.
- Evidence link or commit hash.

A requirement with no test evidence must not be marked `TESTED`.

## 59. Definition of Done

A task is done only when:
- Requirements are satisfied.
- Implementation is complete and reviewed.
- Tests are added and executed.
- Static analysis is reviewed.
- Documentation is updated.
- No secrets or generated junk are committed.
- Observability and failure behavior are addressed.
- Traceability matrix is updated.
- Known limitations are documented.
- The agent reports exact evidence.

A feature is not production-ready until the full release gates in Section 38 are satisfied.

---

# Part XIV — Project management and first actions

## 60. Workstream ownership

Assign named human owners before execution. One person may cover multiple roles in a small team, but responsibilities must remain explicit.

- Product owner: scope, priorities, acceptance, release authorization.
- Protocol lead: architecture, math, accounting, protocol review.
- EVM engineer: Solidity contracts and EVM security.
- Solana engineer: Rust programs and Solana account/runtime design.
- Backend engineer: API, quote engine, indexers, database.
- Frontend engineer: wallet flows and user experience.
- DevOps/SRE: infrastructure, observability, deployment, recovery.
- Security reviewer: threat model, secure design, audit coordination.

An autonomous agent may assist with implementation, tests, documentation, and analysis. It must not be the sole approver of security-sensitive design or production release.

## 61. First ten tasks — do these in order

1. Create the repository and add this document as `docs/plan.md`.
2. Create `docs/adr/` and the ADR template.
3. Create `docs/requirements-traceability.csv`.
4. Produce the Product Requirements Document from Sections 1–3.
5. Resolve target EVM networks and Solana cluster in an ADR.
6. Resolve V2 inclusion and the exact EVM pool-generation strategy in an ADR.
7. Resolve whether v4-inspired singleton architecture is Release 1 scope or a later milestone.
8. Produce EVM and Solana threat models separately.
9. Produce and review the mathematical/accounting specifications before writing protocol code.
10. Build the CI and local test foundation; only then begin the first on-chain vertical slice.

## 62. Required documents before the first smart-contract/program implementation

The following must exist and be reviewed:
- `docs/product/requirements.md`
- `docs/architecture/system-architecture.md`
- `docs/architecture/evm-architecture.md`
- `docs/architecture/solana-architecture.md`
- `docs/protocol/fee-and-rounding-spec.md`
- `docs/protocol/evm-v2-spec.md` (if V2 is included)
- `docs/protocol/evm-clmm-spec.md`
- `docs/protocol/evm-singleton-spec.md` (if approved)
- `docs/protocol/solana-amm-spec.md`
- `docs/protocol/solana-clmm-spec.md`
- `docs/security/threat-model-evm.md`
- `docs/security/threat-model-solana.md`
- `docs/security/token-compatibility.md`
- `docs/operations/incident-response.md`
- `docs/adr/` records for all material choices

## 63. Agent's first response after reading this plan

Before writing code, the agent must return:

1. A concise summary of the product and release scope.
2. A list of unresolved decisions requiring owner input.
3. A proposed repository and toolchain plan.
4. A dependency and risk register.
5. A phase-by-phase implementation roadmap.
6. A list of specification documents it will create first.
7. Confirmation that no code or deployment has been started.
8. The first ADRs it recommends.

The agent must wait for approval on decisions that materially affect architecture, economics, security, or scope.

---

# Appendix A — Explicit feature map against a Uniswap-class DEX

This is a product capability map, not a claim of compatibility with Uniswap.

| Capability | OmniFi requirement | Release |
|---|---|---|
| Constant-product pools | Optional V2-style reference AMM | R1 if justified |
| Concentrated liquidity | Native EVM CLMM and native Solana CLMM workstreams | R1 |
| Singleton pool manager | EVM v4-inspired architecture, separately gated | R1 only if approved |
| Hooks | Restricted reviewed hooks; no arbitrary hook marketplace | Later / gated |
| Flash accounting | EVM singleton design only; formally specified | Gated |
| Dynamic fees | Bounded and reviewed fee policy | Gated |
| Custom accounting | Only if use case and invariants are approved | Later |
| LP positions | Full create/increase/decrease/collect/close lifecycle | R1 |
| Position NFTs | EVM option; Solana uses a native account/token model | ADR |
| Permit2-style authorization | Prefer reviewed integration; otherwise standard approvals | R1 |
| Universal-router-like composition | Restricted command set; no arbitrary external calls | R1 / gated |
| Multi-hop swaps | Bounded route search and on-chain enforcement | R1 |
| Split routes | Only after quote and execution accounting is proven | R1 / gated |
| Partial fills | Deferred unless refunds and residual balances are proven safe | Later |
| Native currency | Chain-specific wrap/unwrap support | R1 where applicable |
| Quote simulation | Chain-specific simulation and freshness | R1 |
| Gas/compute-aware routing | Estimated cost disclosed separately | R1 |
| Analytics and indexer | Reorg/fork-aware, reconcilable data platform | R1 |
| SDK/API | Separate chain SDKs plus explicit unified facade | R1 |
| Lending | Not a DEX core feature | Later |
| Bridge | Not a DEX core feature; separate threat model | Later |

# Appendix B — Security and implementation anti-patterns

The agent must reject or flag these patterns:

- “We will add security later.”
- One contract/program that handles every product feature.
- Reusing EVM accounting assumptions in Solana.
- Floating-point token accounting.
- Trusting token symbols, logos, or API-provided prices.
- Unlimited approvals by default without clear user disclosure.
- Arbitrary external-call router commands.
- Unrestricted user-supplied hooks.
- Admin key stored in `.env` committed to Git.
- Upgradeable contracts without a documented upgrade authority and migration policy.
- Solana instructions that trust client-provided vaults or PDAs without validation.
- Indexer database treated as canonical protocol state.
- Blind retries for non-idempotent transactions.
- A green unit-test suite treated as proof of economic safety.
- A testnet deployment described as production-ready.
- A third-party audit described as a guarantee of safety.
- Mainnet deployment before independent audits and explicit authorization.

# Appendix C — Glossary

- **AMM:** Automated market maker.
- **CLMM:** Concentrated-liquidity market maker.
- **Pool:** On-chain market state for a token/currency pair and configuration.
- **Tick:** Discrete price boundary used by concentrated-liquidity designs.
- **LP:** Liquidity provider.
- **Position:** Ownership record for liquidity and its fee entitlement.
- **Hook:** External callback component in a hook-enabled pool architecture.
- **Flash accounting:** Transaction-scoped accounting that nets asset deltas before final settlement.
- **PDA:** Program Derived Address on Solana.
- **CPI:** Cross-Program Invocation on Solana.
- **Finality:** Chain-specific assurance that a transaction is sufficiently settled.
- **Reorg/fork:** A chain history change requiring indexer rollback or reconciliation.
- **MEV:** Value extracted through transaction ordering, inclusion, or exclusion.
- **Slippage:** Difference between expected and executed price/output.
- **Price impact:** Trade-induced movement in the pool price.
- **ADR:** Architecture Decision Record.
- **BFF:** Backend for frontend.
- **SLO:** Service-level objective.
- **RPO/RTO:** Recovery point objective / recovery time objective.

---

## Final instruction

Build OmniFi as a sequence of independently verifiable, security-gated deliverables. The target is a production-oriented engineering process and architecture. Production readiness is an evidence-based release decision, not a property that can be promised by a plan document. No real user funds should be accepted until every applicable specification, testing, audit, operational, and authorization gate has passed.
