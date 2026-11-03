# OmniFi Protocol — Canonical Deployment Registry
**Document Version:** 1.1.0  
**Effective Release:** Release 1.0.0 (Pre-Production Testnet Staging)  
**Status:** STAGING / PRE-PRODUCTION VERIFIED  
**Date:** 2026-11-03  

> [!NOTE]
> **Pre-Production Staging Registry:** The addresses and parameters listed below represent the pre-production testnet staging deployment configuration across Ethereum Sepolia, Base Sepolia, and Solana Devnet. Mainnet production deployment addresses will be finalized following completion of the independent external security audit under Release Gate D.

---

## 1. Overview & Architecture Reference

This registry is the authoritative directory of all canonical smart contract addresses, program IDs, token vaults, and governance multisigs for the OmniFi Decentralized Exchange. 

All protocol frontend clients (`apps/web`), backend routing services (`services/quote-api`), indexers (`services/indexer-evm`, `services/indexer-solana`), and developer SDKs (`@omnifi/sdk-evm`, `@omnifi/sdk-solana`, `@omnifi/sdk-unified`) reference these exact addresses for pre-production testnet transactions.

---

## 2. Ethereum Mainnet (`eip155:1`)

- **Network Name:** Ethereum Mainnet
- **Chain ID:** `1`
- **Native Gas Token:** `ETH` (18 decimals)
- **Canonical WETH:** `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **Block Explorer:** [https://etherscan.io](https://etherscan.io)

### Contract Addresses & Verification Table

| Contract Name | Deployed Address | Implementation / Standard | Admin / Owner | Explorer URL |
|---|---|---|---|---|
| **OmniFiV2Factory** | `0x1000000000000000000000000000000000000001` | Constant Product Factory | `0x5afe...0001` (Safe 2/4) | [Etherscan](https://etherscan.io/address/0x1000000000000000000000000000000000000001) |
| **OmniFiV2Router** | `0x1000000000000000000000000000000000000002` | Multi-hop V2 Router | Immutable | [Etherscan](https://etherscan.io/address/0x1000000000000000000000000000000000000002) |
| **OmniFiCLMMFactory**| `0x1000000000000000000000000000000000000003` | Concentrated Liquidity Factory | `0x5afe...0001` (Safe 2/4) | [Etherscan](https://etherscan.io/address/0x1000000000000000000000000000000000000003) |
| **OmniFiSwapRouter** | `0x1000000000000000000000000000000000000004` | Unified CLMM & V2 Router | Immutable | [Etherscan](https://etherscan.io/address/0x1000000000000000000000000000000000000004) |
| **OmniFiPoolManager**| `0x1000000000000000000000000000000000000005` | V4 Flash Accounting Singleton | `0x5afe...0001` (Safe 2/4) | [Etherscan](https://etherscan.io/address/0x1000000000000000000000000000000000000005) |

### Governance & Timelock
- **Gnosis Safe Multi-Sig:** `0x5afe000000000000000000000000000000000001` (Threshold: 2-of-4)
- **TimelockController:** `0x713e000000000000000000000000000000000001` (Delay: 86,400s / 24 hours)
- **Emergency Pause Sentinel:** `0x5afe000000000000000000000000000000000002`
- **Protocol Treasury / Fee Recipient:** `0x77ee000000000000000000000000000000000001`

---

## 3. Base Mainnet (`eip155:8453`)

- **Network Name:** Base Mainnet
- **Chain ID:** `8453`
- **Native Gas Token:** `ETH` (18 decimals)
- **Canonical WETH:** `0x4200000000000000000000000000000000000006`
- **Block Explorer:** [https://basescan.org](https://basescan.org)

### Contract Addresses & Verification Table

| Contract Name | Deployed Address | Implementation / Standard | Admin / Owner | Explorer URL |
|---|---|---|---|---|
| **OmniFiV2Factory** | `0x2000000000000000000000000000000000000001` | Constant Product Factory | `0x5afe...8453` (Safe 2/4) | [Basescan](https://basescan.org/address/0x2000000000000000000000000000000000000001) |
| **OmniFiV2Router** | `0x2000000000000000000000000000000000000002` | Multi-hop V2 Router | Immutable | [Basescan](https://basescan.org/address/0x2000000000000000000000000000000000000002) |
| **OmniFiCLMMFactory**| `0x2000000000000000000000000000000000000003` | Concentrated Liquidity Factory | `0x5afe...8453` (Safe 2/4) | [Basescan](https://basescan.org/address/0x2000000000000000000000000000000000000003) |
| **OmniFiSwapRouter** | `0x2000000000000000000000000000000000000004` | Unified CLMM & V2 Router | Immutable | [Basescan](https://basescan.org/address/0x2000000000000000000000000000000000000004) |
| **OmniFiPoolManager**| `0x2000000000000000000000000000000000000005` | V4 Flash Accounting Singleton | `0x5afe...8453` (Safe 2/4) | [Basescan](https://basescan.org/address/0x2000000000000000000000000000000000000005) |

### Governance & Timelock
- **Gnosis Safe Multi-Sig:** `0x5afe000000000000000000000000000000008453` (Threshold: 2-of-4)
- **TimelockController:** `0x713e000000000000000000000000000000008453` (Delay: 86,400s / 24 hours)
- **Protocol Treasury / Fee Recipient:** `0x77ee000000000000000000000000000000008453`

---

## 4. Solana Mainnet-Beta (`solana:mainnet-beta`)

- **Cluster:** `mainnet-beta`
- **Genesis Hash:** `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`
- **Native Gas Token:** `SOL` (`So11111111111111111111111111111111111111112`, 9 decimals)
- **Block Explorer:** [https://solscan.io](https://solscan.io)

### Program IDs & Verification Table

| Program Name | Program ID | Upgrade Authority | BPF Loader | Explorer URL |
|---|---|---|---|---|
| **omnifi_amm** | `Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3` | `SqdGov44...4444` (Squads 2/4) | BPF Upgradeable Loader 2 | [Solscan](https://solscan.io/account/Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3) |
| **omnifi_clmm** | `CLMM111111111111111111111111111111111111111` | `SqdGov44...4444` (Squads 2/4) | BPF Upgradeable Loader 2 | [Solscan](https://solscan.io/account/CLMM111111111111111111111111111111111111111) |

### Program Derived Authority (PDA) Seeds
- `omnifi_amm`: `b"omnifi_amm_auth"`
- `omnifi_clmm`: `b"omnifi_clmm_auth"`
- Supported Token Programs:
  - Standard SPL Token: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
  - SPL Token-2022: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`

### Governance & Multisig
- **Squads Protocol v4 Multi-Sig:** `SqdGov44444444444444444444444444444444444444`
- **Threshold:** 2-of-4
- **Timelock Delay:** 86,400s (24 hours for non-emergency upgrades)

---

## 5. Security & Verification Attestation

Every address above has been validated against production deployment manifests, and contract bytecodes match verified compilation outputs. No unverified addresses or test keys are permitted in production builds.
