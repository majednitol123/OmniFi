# Contributing to OmniFi

## Current Status

OmniFi is in **Phase 0: Product Discovery**. No implementation code exists yet. Contributions at this stage are limited to:

- Product requirements review
- Architecture Decision Record (ADR) proposals and feedback
- Threat model review
- Specification review

## Development Workflow

> This section will be expanded when Phase 2 (Repository and CI Foundation) establishes the CI/CD pipeline.

### Branching Strategy

[TO BE DETERMINED via ADR]

### Pull Request Process

1. Every change must include tests and documentation appropriate to the affected layer.
2. PRs must pass formatting, linting, static analysis, and all applicable tests.
3. Security-sensitive changes require review from the security reviewer.
4. On-chain code changes require additional protocol lead review.

### Commit Messages

Use clear, descriptive commit messages. Reference requirement IDs where applicable:

```
[REQ-004] Add tick-to-price conversion specification

- Define fixed-point format and Q-notation constants
- Specify rounding direction for tick boundaries
- Add overflow bounds analysis
```

## Architecture Decision Records

All material decisions must be documented as ADRs in `docs/adr/`. Use the template at `docs/adr/ADR-000-template.md`.

## Code of Conduct

[TO BE DETERMINED]

## Non-Negotiable Rules

From `docs/plan.md` §0.1:

1. Work in small vertical slices. Each slice must compile, test, document, and pass review.
2. Never mark a requirement complete because files or function stubs exist.
3. Never invent chain IDs, RPC URLs, token addresses, program IDs, or credentials.
4. Keep EVM and Solana implementations separate.
5. Keep secrets out of source control, logs, test fixtures, and generated docs.
6. Every change must include tests and documentation.

