# OmniFi — Complete Security Tooling Implementation & Hardening

## Role

Act as a Principal Smart Contract Security Engineer, Blockchain Protocol Security Auditor, EVM Security Researcher, Solana Security Engineer, and DevSecOps Architect.

Your mission is to perform a comprehensive security assessment of the entire OmniFi repository and implement a professional, automated, production-oriented security engineering framework.

Do not limit the work to installing security tools. You must inspect the complete codebase, understand its architecture, identify security-critical components, select appropriate tools, integrate them, create meaningful security tests, execute the tools, investigate findings, fix confirmed issues, and establish repeatable security checks.

The final result should demonstrate the security engineering practices expected from a serious multi-chain DeFi protocol engineering team.

---

## 1. First: Understand the Entire Repository

Before changing anything:

1. Inspect the complete repository structure.
2. Read all relevant README files, architecture documents, development plans, package manifests, configuration files, deployment scripts, and existing tests.
3. Identify every application, service, package, smart contract, program, SDK, API, indexer, and infrastructure component.
4. Identify all supported blockchain environments.
5. Determine which components are implemented, partially implemented, experimental, or incomplete.
6. Identify existing testing frameworks, CI/CD workflows, security tools, and deployment processes.
7. Understand dependencies and interactions between components.

Create an architecture and security inventory.

Do not assume that every component exists just because it is mentioned in documentation. Verify it in the source code.

Do not modify or replace existing architecture simply to accommodate a security tool.

## 2. Security Tool Selection

Select tools based on the actual technologies and components discovered in the repository.

### A. EVM / Solidity Security

Evaluate and integrate the following tools where applicable:

**Foundry**
- Unit testing.
- Fuzz testing.
- Stateful invariant testing.
- Mainnet fork testing where relevant.
- Gas profiling and regression testing.
- Reproducible test execution.

**Slither**
- Solidity static analysis.
- Access-control analysis.
- Reentrancy-related findings.
- Dangerous external-call patterns.
- Unchecked return values.
- Arithmetic and code-quality issues.
- Custom analysis detectors where justified.

**Echidna**
- Property-based fuzzing.
- Stateful fuzzing.
- Protocol invariant validation.
- Edge-case exploration.

**Medusa**
- Coverage-guided smart contract fuzzing.
- Stateful transaction-sequence testing.
- Complex protocol interaction testing.

**Aderyn**
- Independent Solidity static analysis.
- Complementary security findings.
- Additional detection coverage.

**Certora Prover**
- Formal verification for selected critical contracts and protocol rules.
- Authorization properties.
- Accounting correctness.
- Liquidity and reserve consistency.
- Token transfer and settlement properties.
- Critical state-transition guarantees.

Use Certora only where formal specifications can be meaningfully defined and verified. If access to its infrastructure or credentials is unavailable, prepare the specifications and document the execution requirements without claiming verification was completed.

### B. Solana / Rust Security

Evaluate and integrate:

- Anchor testing framework.
- Rust unit and integration tests.
- cargo-audit for vulnerable dependencies.
- cargo-deny for dependency policies and license checks.
- LiteSVM or Mollusk for suitable program-level testing.
- Additional static analysis and linting where useful.

Focus on:
- Account validation.
- Signer authorization.
- Account ownership.
- PDA derivation and validation.
- CPI security.
- Token program interactions.
- Token-2022 compatibility.
- Arithmetic safety.
- Rent and account lifecycle handling.
- Transaction atomicity.
- Cross-instruction assumptions.

Do not introduce Solana tools into EVM-only components or vice versa.

### C. Backend, SDK, API, and Infrastructure Security

Inspect the actual backend technology stack and integrate appropriate security checks, such as:

- Dependency vulnerability scanning.
- Secret detection.
- Static application security analysis.
- Container image scanning.
- Dockerfile and Kubernetes configuration scanning.
- API authentication and authorization tests.
- Input validation and rate-limit tests.
- Dependency and license policy checks.

Evaluate tools such as:
- Gitleaks.
- Semgrep.
- Trivy.
- OWASP ZAP for appropriate API/web security testing.
- npm audit or the equivalent package-manager audit command.
- Relevant language-specific security tools.

Select only tools that are useful for the actual repository.

Never expose real secrets or credentials in reports, logs, or generated artifacts.

---

## 3. OmniFi Protocol Security Coverage

Inspect and test every relevant protocol component found in the repository.

Pay special attention to the following areas where they exist.

### EVM AMM
- Swap accounting.
- Reserve consistency.
- Constant-product invariant.
- Fee calculation.
- Slippage protection.
- Deadline validation.
- Token transfer behavior.
- Rounding and precision.
- Reentrancy protections.

### Concentrated Liquidity / CLMM
- Tick math.
- Tick boundary conditions.
- Liquidity accounting.
- Position ownership.
- Fee growth accounting.
- Fee collection.
- Price movement.
- Rounding and precision.
- Liquidity addition and removal.
- Swap traversal across ticks.

### Uniswap v4-Inspired Architecture and Hooks

If the repository contains singleton or hook-based architecture, inspect:

- Hook lifecycle and callback assumptions.
- Hook permissions.
- External call boundaries.
- Flash accounting.
- Transient storage assumptions.
- Delta accounting and conservation.
- BeforeSwap and AfterSwap behavior.
- Dynamic fee logic.
- Reentrancy and callback interactions.
- Access control.
- Settlement correctness.

Do not claim official Uniswap v4 compatibility unless the implementation has been independently verified against the relevant specifications.

### Liquidity Positions
- Position authorization.
- Ownership validation.
- Liquidity accounting.
- Fee accounting.
- Deposit and withdrawal correctness.
- Unauthorized position modification.
- Rounding edge cases.

### Router and Smart Order Routing
- Route validation.
- Token path validation.
- Slippage enforcement.
- Deadline enforcement.
- Multi-hop execution.
- Partial failure behavior.
- Approval handling.
- External protocol interactions.
- Execution consistency.

### Permit2-Style Authorization

If implemented, inspect:
- Signature validation.
- Nonce management.
- Replay protection.
- Expiration.
- Domain separation.
- Chain ID validation.
- Token and spender permissions.
- Signature malleability considerations.

Do not assume the implementation has the same guarantees as official Permit2.

### Solana AMM / CLMM
- Account constraints.
- PDA validation.
- Tick-array boundaries.
- Liquidity position accounting.
- Swap calculations.
- Token-2022 behavior.
- CPI interactions.
- Signer and authority checks.
- Transaction composition and execution.

### SDK, API, and Indexer
- Authentication and authorization.
- Input validation.
- RPC failure handling.
- Event consistency.
- Duplicate event processing.
- Reorg and fork recovery.
- Idempotency.
- Rate limiting.
- WebSocket authorization.
- Database access control.
- Secret management.

Only test components that actually exist. Record missing components separately.

---

## 4. Build a Meaningful Security Test Suite

Do not simply run tools against the codebase and consider the job complete.

Create meaningful tests based on protocol behavior.

Where applicable, implement:

### Unit Tests
Test normal execution, boundary conditions, invalid inputs, authorization failures, and expected reverts.

### Fuzz Tests
Generate randomized inputs for:
- Token amounts.
- Swap amounts.
- Prices.
- Ticks.
- Liquidity.
- Fees.
- Deadlines.
- Position parameters.
- Authorization data.

### Invariant Tests

Define and test properties appropriate to the implementation, including:

- Accounting consistency.
- Reserve and liquidity consistency.
- No unauthorized state modification.
- Correct token balance changes.
- Position ownership consistency.
- Fee accounting consistency.
- Valid state transitions.
- Settlement and delta conservation.

Do not invent mathematical invariants that are incompatible with the actual protocol design. Derive each property from the implementation and its intended specifications.

### Stateful Fuzzing

Test sequences of protocol operations rather than only isolated calls.

Examples:
- Add liquidity → swap → remove liquidity.
- Multiple swaps → fee collection.
- Create position → modify position → close position.
- Authorization → execution → nonce reuse attempt.
- Multi-hop swap → invalid route → failure handling.

Use safe, isolated local test environments. Never run fuzzing or destructive security tests against production systems.

### Regression Tests

Every confirmed vulnerability or security-relevant bug fixed during this work must receive a regression test that reproduces the original issue.

---

## 5. Security Automation and CI/CD

Integrate security checks into the existing CI/CD architecture.

Use GitHub Actions if the repository uses GitHub Actions.

Create or improve workflows for:

1. Solidity formatting and compilation.
2. Foundry unit tests.
3. Foundry fuzz tests.
4. Foundry invariant tests.
5. Slither analysis.
6. Aderyn analysis.
7. Echidna fuzzing.
8. Medusa fuzzing where practical.
9. Rust tests and linting.
10. cargo-audit and cargo-deny.
11. Backend dependency auditing.
12. Secret scanning.
13. Container and infrastructure scanning.

Requirements:

- Run appropriate checks on pull requests.
- Run relevant checks on pushes to important branches.
- Pin dependencies and GitHub Actions versions where practical.
- Use least-privilege workflow permissions.
- Avoid exposing secrets in logs.
- Cache dependencies safely.
- Separate fast checks from longer-running security jobs.
- Make critical failures visible.
- Avoid allowing an optional or unavailable external tool to silently create a false passing result.

Create a clear security gate that distinguishes blocking failures from informational findings.

Do not introduce CI checks that cannot execute reliably or that break normal development without a documented reason.

---

## 6. Security Findings and Remediation

For every finding:

1. Record the affected component and file.
2. Identify the relevant code location.
3. Explain the security issue.
4. Explain its potential impact.
5. Assign a severity using a consistent methodology.
6. Determine whether the finding is confirmed, suspected, informational, or a false positive.
7. Explain the evidence.
8. Recommend a remediation.
9. Implement a fix when the issue is confirmed and the fix is within scope.
10. Add a regression test.
11. Re-run the relevant security checks.

Do not blindly apply automated fixes.

Do not suppress findings simply to achieve a clean report.

If a finding is a false positive, document the reasoning and use the narrowest possible suppression with an explanation.

Do not claim a vulnerability is fixed until the relevant regression test and verification checks pass.

---

## 7. Security Documentation

Create a dedicated security documentation structure that fits the existing repository.

Include:

**SECURITY.md**
- Vulnerability reporting process.
- Supported versions.
- Security contact guidance.
- Responsible disclosure expectations.

**Security architecture documentation**
- Security boundaries.
- Trust assumptions.
- Privileged roles.
- External dependencies.
- Critical state transitions.
- Cross-chain trust assumptions, if applicable.

**Threat model**
- Assets.
- Trust boundaries.
- Entry points.
- Privileged operations.
- External integrations.
- Threat scenarios.
- Mitigations.
- Residual risks.

**Security test documentation**
- Tools used.
- Installation requirements.
- Commands to execute.
- Test coverage.
- Known limitations.

**Security findings report**
- Findings by severity.
- Affected components.
- Evidence.
- Remediation status.
- Regression test references.

**Security tooling guide**
- Local execution instructions.
- CI execution instructions.
- Configuration details.
- How to interpret reports.

Keep documentation accurate and synchronized with the implementation.

---

## 8. Implementation Rules

Follow these rules strictly:

1. Do not rewrite the entire application.
2. Do not change business logic unless required to fix a confirmed issue.
3. Do not introduce unnecessary dependencies.
4. Do not duplicate existing test infrastructure.
5. Preserve existing APIs and interfaces unless a security fix requires a documented change.
6. Preserve current deployment configurations.
7. Do not remove existing tests.
8. Do not weaken security checks to make CI pass.
9. Do not fabricate test results, audit results, or coverage numbers.
10. Do not claim that automated tools guarantee security.
11. Do not claim an external audit or formal verification was completed unless it actually was.
12. Never use production private keys, seed phrases, or real user funds during testing.
13. Never deploy modified contracts or programs to mainnet as part of this task.
14. Do not commit secrets, generated credentials, or sensitive test data.
15. Maintain compatibility with the existing project architecture.

Before making substantial changes, present a concise implementation plan based on the actual repository. Then proceed phase by phase, preserving working changes and reporting blockers.

---

## 9. Execution Phases

Execute the project in the following order.

**Phase 1 — Repository Discovery**
- Full repository inspection.
- Architecture inventory.
- Technology identification.
- Existing security coverage assessment.

**Phase 2 — Threat Modeling**
- Identify assets, trust boundaries, privileged operations, and attack surfaces.
- Build a component-level threat model.
- Prioritize critical protocol components.

**Phase 3 — Security Tooling Setup**
- Select tools based on actual technologies.
- Configure dependencies and versions.
- Add reproducible local commands.
- Integrate the tools without disrupting existing development.

**Phase 4 — Security Test Engineering**
- Add unit, fuzz, invariant, and stateful tests.
- Define meaningful protocol properties.
- Add regression tests where necessary.

**Phase 5 — Security Scanning**
- Run static analysis.
- Run dependency audits.
- Run fuzzers.
- Run infrastructure and secret scanning.
- Record actual findings.

**Phase 6 — Vulnerability Remediation**
- Investigate findings.
- Fix confirmed issues.
- Add regression tests.
- Document unresolved risks and false positives.

**Phase 7 — CI/CD Integration**
- Add automated security workflows.
- Configure security gates.
- Verify workflows and commands.

**Phase 8 — Final Verification**
- Re-run all relevant checks.
- Verify the changes do not break existing functionality.
- Review generated reports.
- Confirm documentation matches the implementation.

---

## 10. Final Deliverables

At completion, provide:

1. Complete security architecture inventory.
2. Threat model.
3. Security tooling inventory with reasons for selecting each tool.
4. List of all files created or modified.
5. Security tests implemented.
6. Actual commands used.
7. Actual test and scanner results.
8. Confirmed vulnerabilities and remediation details.
9. Unresolved findings and limitations.
10. CI/CD security workflow documentation.
11. Local developer security commands.
12. Final security readiness assessment.

Provide a summary table:

| Area | Tool / Framework | Implementation Status | Verification Status |
|---|---|---|---|
| EVM testing | Foundry | Implemented and verified | 166/166 tests passed across 26 suites on Cancun target |
| Solidity static analysis | Slither | Implemented and verified | Analyzed 59 contracts with 102 detectors; report generated |
| Solidity static analysis | Aderyn | Implemented and verified | Analyzed 46 Solidity files (3,806 nSLOC); report generated |
| Property fuzzing | Echidna | Implemented, verification pending | Configured (chains/evm/echidna.yaml); host binary pending |
| Stateful fuzzing | Medusa | Implemented, verification pending | Configured (chains/evm/medusa.json); host binary pending |
| Formal verification | Certora | Implemented, verification pending | Spec authored (chains/evm/certora/); cloud prover token pending |
| Solana testing | Anchor / LiteSVM / Mollusk | Implemented and verified | 28 Cargo unit tests passed + 7 Anchor integration tests |
| Rust dependencies | cargo-audit / cargo-deny | Implemented and verified | 0 crate vulnerabilities; 100% supply chain policy compliance |
| Backend security | Applicable tools | Implemented and verified | SSRF protection, RFC 7807 problem details, rate limiting, Zod |
| Infrastructure security | Trivy / applicable tools | Implemented and verified | Dockerfiles & filesystem scanned: 0 misconfigs, 0 secrets |
| Secret scanning | Gitleaks | Implemented and verified | 0 leaks detected across 10.65MB git repository history |
| CI/CD | GitHub Actions | Implemented and verified | 4 hardened workflows active with fail-closed security gates |

Use these status values accurately:
- Implemented and verified.
- Implemented, verification pending.
- Partially implemented.
- Not applicable.
- Blocked by external dependency or credentials.
- Not implemented.

Never mark a tool as verified merely because it was installed.

## Final Objective

Transform OmniFi's existing security practices into a structured, reproducible, automated, and evidence-based security engineering framework.

The priority is not the number of tools installed. The priority is meaningful security coverage, protocol-specific invariants, reproducible testing, verified remediation, and maintainable automation.

Work systematically across the entire repository. Do not stop after creating a plan or installing dependencies. Complete every feasible phase, clearly report anything blocked, and never fabricate successful results.