# PredictX Contracts

Solidity smart contracts deployed on Base Sepolia using Foundry.

## Contracts

| Contract | Description |
|----------|-------------|
| `MarketRegistry.sol` | Creates and manages prediction markets (question, X endpoint, target, deadline) |
| `BettingPool.sol` | Handles USDC bets (Yes/No), pool tracking, payouts, and refunds |
| `MarketResolution.sol` | Receives signed Chainlink CRE reports via KeystoneForwarder and resolves markets |

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| MarketRegistry | [`0x3a428C10D19a41F584E8Ba5F34544D166cbf9131`](https://sepolia.basescan.org/address/0x3a428C10D19a41F584E8Ba5F34544D166cbf9131) |
| BettingPool | [`0xbC793e9B354Bb247fA059e60B82f4C5Fa9E65239`](https://sepolia.basescan.org/address/0xbC793e9B354Bb247fA059e60B82f4C5Fa9E65239) |
| MarketResolution | [`0x0D89d2E889738734584C7A65b03f3f527e9F9094`](https://sepolia.basescan.org/address/0x0D89d2E889738734584C7A65b03f3f527e9F9094) |
| USDC (Test) | [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |

## Setup

```bash
# install dependencies
forge install

# run tests
forge test

# deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast
```
