# PredictX CRE Workflow

Chainlink CRE (Chainlink Runtime Environment) workflow that automatically resolves prediction markets.

## How It Works

1. Runs on a cron schedule (every 15 min)
2. Reads active markets from `MarketRegistry` on Base Sepolia
3. Fetches the corresponding X API metric via `HTTPClient` within the DON
4. Aggregates responses across nodes using median consensus
5. Signs the resolution payload and submits it to `MarketResolution` on-chain

## Structure

| File | Purpose |
|------|---------|
| `resolve-market/main.ts` | Workflow logic (cron, read chain, fetch X API, consensus, write chain) |
| `resolve-market/workflow.yaml` | Staging/production target config |
| `project.yaml` | RPC and account settings for Base Sepolia |
| `secrets.yaml` | Manages `X_API_BEARER_TOKEN` for DON nodes |

## Setup

```bash
cd resolve-market
bun install

# simulate locally and broadcast result on-chain
cre workflow simulate --target=staging-settings --broadcast
```

See [Chainlink CRE docs](https://docs.chain.link/) for deploying to the DON.
