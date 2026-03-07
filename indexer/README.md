# PredictX Indexer

Goldsky indexer that indexes `BettingPool` contract events on Base Sepolia for efficient querying by the web app.

## Files

| File | Purpose |
|------|---------|
| `goldsky.json` | Indexer config (contract address, start block, chain) |
| `abi.json` | BettingPool ABI for event decoding |

## Setup

Deploy using the [Goldsky CLI](https://docs.goldsky.com/):

```bash
goldsky subgraph deploy predictx-betting-pool --from-abi goldsky.json
```
