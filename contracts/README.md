# PredictX Contracts

Solidity smart contracts deployed on Base Sepolia using Foundry.

## Contracts

| Contract | Description |
|----------|-------------|
| `MarketRegistry.sol` | Creates and manages prediction markets (question, X endpoint, target, deadline) |
| `BettingPool.sol` | Handles USDC bets (Yes/No), pool tracking, payouts, and refunds |
| `MarketResolution.sol` | Receives signed Chainlink CRE reports via KeystoneForwarder and resolves markets |

## Setup

```bash
# install dependencies
forge install

# run tests
forge test

# deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast
```
