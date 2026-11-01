# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OmniFi, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### Reporting Process

1. Email: [TO BE DETERMINED — project owner must provide a security contact]
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if any)
3. Expected response time: [TO BE DETERMINED]

## Scope

This security policy covers:

- Smart contracts (EVM Solidity, Solana Rust/Anchor programs)
- Backend services (API, indexers, workers)
- Frontend applications
- SDK and client libraries
- Infrastructure and deployment

## Security Practices

- All on-chain code requires independent audit before mainnet deployment
- No production private keys, seed phrases, or credentials in source control
- Multisig or managed threshold signing for sensitive administrative roles
- Dependency pinning and automated vulnerability scanning
- Reproducible builds and signed release artifacts

## Supported Versions

| Version | Supported |
|---------|-----------|
| Pre-release | ⚠️ Not yet deployed — no production version exists |

## Disclosure Policy

[TO BE DETERMINED — the project must establish a coordinated vulnerability disclosure process before any production deployment.]

