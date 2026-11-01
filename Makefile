.PHONY: setup build test test-all test-evm test-solana lint fmt fmt-check up down clean hash-artifacts

# Default target
all: build test

# Environment setup
setup:
	pnpm install
	cd chains/evm && forge install
	cd chains/solana && cargo check

# Build all monorepo targets
build:
	pnpm turbo run build
	cd chains/evm && forge build
	cd chains/solana && anchor build

# Run unit tests
test:
	pnpm turbo run test

# Run EVM tests
test-evm:
	cd chains/evm && forge test -vvv

# Run Solana tests
test-solana:
	cd chains/solana && cargo test

# Run all test suites
test-all: test test-evm test-solana

# Linting
lint:
	pnpm turbo run lint
	cd chains/solana && cargo clippy -- -D warnings

# Code formatting
fmt:
	pnpm format
	cd chains/evm && forge fmt
	cd chains/solana && cargo fmt --all

# Check code formatting without writing
fmt-check:
	pnpm format:check
	cd chains/evm && forge fmt --check
	cd chains/solana && cargo fmt --all -- --check

# Docker development services
up:
	docker compose up -d

down:
	docker compose down

# Clean build artifacts
clean:
	pnpm turbo run clean
	cd chains/evm && forge clean
	cd chains/solana && cargo clean
	rm -rf build-manifest.sha256

# Hash build artifacts for audit
hash-artifacts:
	./scripts/hash-artifacts.sh

