# OmniFi Protocol — Security Tooling Guide & Operational Manual

**Version:** 1.0.0  
**Date:** 2026-11-03  
**Status:** Certified & Locally Verified  
**Auditor / Security Lead:** Principal Protocol Security Architect & DevSecOps Engineer  
**Compliance Standard:** `security_implemetion.md` Phase 3, NIST SP 800-53, OWASP Top 10 API Security  

---

## 1. Security Tooling Overview & Architecture

The OmniFi protocol implements an enterprise-grade, defense-in-depth security toolchain tailored for its multi-chain (EVM Cancun and Solana Anchor) smart contract footprint and TypeScript off-chain routing engine.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                OMNIFI SECURITY TOOLING STACK                                 │
├───────────────────────┬────────────────────────┬─────────────────────────────────────────────┤
│ Domain                │ Primary Tools          │ Role & Scope                                │
├───────────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│ **EVM Smart Contracts**│ Foundry (v1.4.4)       │ Unit, fuzz, stateful invariant testing      │
│                       │ Aderyn (v0.1.7)        │ Rust-based Solidity AST static analysis     │
│                       │ Slither (v0.11.6)      │ Dataflow, reentrancy, CFG static analysis   │
│                       │ Echidna & Medusa       │ Property and coverage-guided fuzzers        │
│                       │ Certora Prover         │ Formal specification rules (OmniFiPool.spec)│
├───────────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│ **Solana Programs**   │ Anchor & Cargo Test    │ Unit, stateful integration, and invariant   │
│                       │ cargo-audit (v0.22.2)  │ RustSec vulnerability advisory scanner      │
│                       │ cargo-deny (v0.20.2)   │ Dependency policy, duplicate, license linter│
├───────────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│ **Backend & API**     │ Gitleaks (v8.30.1)     │ Zero-knowledge secret and key detection     │
│                       │ Trivy (v0.76.1)        │ Container, Dockerfile, and misconfig scan   │
│                       │ pnpm audit             │ Monorepo CVE scanning across Node packages  │
│                       │ Vitest Security Suites │ SSRF prevention, input fuzzing, BigInt math │
└───────────────────────┴────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Tool Inventory, Selection Rationale & Pinned Versions

### 2.1 Foundry
- **Version:** Foundry v1.4.4 (Cancun EVM support, Solc 0.8.26).
- **Configuration:** `chains/evm/foundry.toml` with `cancun` EVM version, supporting transient storage (`tstore`/`tload`), optimizer enabled (200 runs), `[invariant]` (64 runs, depth 32).
- **Selection Rationale:** Native execution, lightning-fast compilation, stateful invariant testing (`FlashAccountingTest`, `CLMMInvariantTest`, `OmniFiV2InvariantTest`).

### 2.2 Aderyn
- **Version:** Aderyn v0.1.7 (Cyfrin).
- **Configuration:** Reads Foundry artifacts directly in `chains/evm`.
- **Selection Rationale:** Independent AST-based Solidity scanner. Uncovered critical findings `H-1` (missing ETH sweep function) and `H-3` (unsafe downcast in fee updates).

### 2.3 Slither
- **Version:** Slither v0.11.6 (Trail of Bits).
- **Configuration:** `chains/evm/slither.config.json` with Foundry compilation framework, filtering out `lib/`, `test/`, and `script/`.
- **Selection Rationale:** Control flow graph (CFG) analysis, reentrancy detector, arbitrary `transferFrom` caller checks.

### 2.4 Echidna & Medusa
- **Configuration:** `chains/evm/echidna.yaml` and `chains/evm/medusa.json`.
- **Selection Rationale:** Coverage-guided stateful property fuzzing for AMM and CLMM invariant validation under extreme boundary parameters.

### 2.5 Certora Prover Specification
- **Configuration:** `chains/evm/certora/specs/OmniFiPool.spec` and `chains/evm/certora/conf/OmniFiPool.conf`.
- **Selection Rationale:** Mathematical invariant specifications for price limits, protocol fee caps ($\le 250$), and reentrancy lock integrity.

### 2.6 Cargo Audit & Cargo Deny
- **Versions:** `cargo-audit 0.22.2`, `cargo-deny 0.20.2`.
- **Configuration:** `chains/solana/deny.toml` configuring advisory policies, license allowlists (MIT, Apache-2.0, BSD-3-Clause, Unicode), and crates.io registry integrity.
- **Selection Rationale:** Prevents supply chain poisoning, detects unmaintained dependencies, and enforces strict open-source licensing compliance.

### 2.7 Gitleaks
- **Version:** Gitleaks v8.30.1.
- **Configuration:** `.gitleaks.toml` with calibrated allowlists for public Ethereum contracts (USDC, WETH) and Solana base58 mints.
- **Selection Rationale:** Industry-standard pre-commit and CI secret scanning to prevent private key or credential leaks.

### 2.8 Trivy
- **Version:** Trivy v0.76.1 (Aqua Security).
- **Configuration:** `trivy.yaml` with misconfiguration, secret, and vulnerability scanners targeting Dockerfiles, Kubernetes, and filesystem artifacts.
- **Selection Rationale:** Container hardening and security misconfiguration detection.

---

## 3. Local Developer Security Commands

All security checks are integrated into the root `Makefile` and `package.json` for deterministic local execution:

| Target | Command | Purpose |
|---|---|---|
| **All Checks** | `make security-all` / `pnpm security:all` | Runs secrets, dependencies, EVM, Solana, and infrastructure scans sequentially |
| **Secrets Scan** | `make security-secrets` / `pnpm security:secrets` | Executes Gitleaks secret detection across working tree (`.gitleaks.toml`) |
| **EVM Security** | `make security-evm` / `pnpm security:evm` | Executes 155 Foundry tests (including invariants) + Aderyn AST static analysis |
| **EVM Slither** | `make security-slither` | Executes Slither static analysis on EVM contracts |
| **Solana Security** | `make security-solana` / `pnpm security:solana` | Runs Anchor unit/integration tests, cargo-audit, and cargo-deny |
| **Dependencies** | `make security-deps` / `pnpm security:deps` | Runs `pnpm audit` and `cargo audit` |
| **Infrastructure** | `make security-infra` / `pnpm security:infra` | Runs Trivy filesystem misconfiguration and secret scanner (`trivy.yaml`) |

---

## 4. How to Interpret Security Reports

### 4.1 Aderyn Reports (`chains/evm/report.md`)
- **High Severity:** Requires immediate remediation or documented security justification. Examples:
  - `H-1`: Contract accepts ETH without withdraw/sweep function (`OmniFiSwapRouter.sol`). Remediation: Add `refundETH()` in Phase 6.
  - `H-3`: Raw integer downcasting without SafeCast. Remediation: Use `SafeCast.toUint128` in Phase 6.
- **Low / Informational:** Code hygiene and gas optimization (e.g., state variables that can be declared immutable).

### 4.2 Slither Findings
- **Reentrancy (`reentrancy-balance`):** Review callback mechanisms. In OmniFi, callbacks (`omniFiMintCallback`, `omniFiSwapCallback`) are protected by the `Slot0.unlocked` reentrancy lock.
- **Weak PRNG (`weak-prng`):** Slither flags `block.timestamp % 2**32` as weak PRNG. In Uniswap V2, this is TWAP timestamp wrapping, NOT randomness; classified as an acceptable false positive.

### 4.3 Cargo Audit & Cargo Deny (`chains/solana/`)
- **Advisories:** Inspect RustSec IDs. If unmaintained dependencies originate from official upstream Solana SDKs (`solana-program v2.3.0`, `anchor-spl v0.32.2`), verify whether safe upgrades exist; if none exist, document in `deny.toml` ignore list.
- **Licenses:** All third-party crates must fall under approved permissive licenses (`MIT`, `Apache-2.0`, `BSD-3-Clause`, `ISC`).

### 4.4 Trivy Container Reports
- **Dockerfile Misconfigurations:** Look for `DS-0002` (root user execution). Containers must specify a non-root `USER` directive (`USER node` or `USER 10001:10001`).

---

## 5. Security Gates & CI/CD Enforcement

Security checks are enforced with explicit non-zero exit codes. No errors or security failures may be swallowed using `|| true` in production CI workflows (addressing finding `F-14`).

- **Blocker Gate (Fails CI):**
  - Gitleaks detects unallowlisted private keys or API credentials.
  - Any Foundry unit, fuzz, or invariant test fails.
  - Any Solana Cargo unit or Anchor integration test fails.
  - Cargo-audit detects unignored critical or high CVEs.
  - Cargo-deny detects unapproved licenses or unauthorized crate registries.
  - Trivy detects CRITICAL container vulnerabilities or root escapes.
- **Informational Gate (Warns, Non-Blocking):**
  - Upstream transitive deprecation warnings with no published fix.
  - Unused dead code or styling warnings in development dependencies.

