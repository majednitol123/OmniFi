# OmniFi

A non-custodial, multi-chain decentralized exchange (DEX) with independently engineered EVM and Solana implementations.

## Status

**Pre-development** — Phase 0: Product Discovery and Decisions is in progress. No implementation has started.

## Product Vision

OmniFi provides a familiar swap and liquidity experience across selected EVM networks and Solana while maintaining separate chain-native protocol implementations. The initial product delivers a dependable DEX before expanding into lending, yield, governance, or cross-chain asset movement.

## Repository Structure

```
omnifi/
├── apps/           # User-facing applications (web, api)
├── packages/       # Shared packages (domain, SDKs, UI, config)
├── chains/         # On-chain protocol implementations
│   ├── evm/        # Solidity contracts (Foundry)
│   └── solana/     # Rust/Anchor programs
├── services/       # Backend services (indexers, quote API, workers)
├── infra/          # Infrastructure (Docker, monitoring, runbooks)
├── docs/           # Documentation, ADRs, specifications
└── tests/          # Cross-cutting test suites (e2e, differential, load, security)
```

## Documentation

- [Project Plan](docs/plan.md) — Authoritative project specification
- [ADR Template](docs/adr/ADR-000-template.md) — Architecture Decision Record format
- [Requirements Traceability](docs/requirements-traceability.csv) — Requirement → implementation → test mapping

## Development

> ⚠️ No implementation code exists yet. This section will be updated when Phase 2 (Repository and CI Foundation) begins.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security policies.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## License

See [LICENSE](LICENSE) for license terms.

