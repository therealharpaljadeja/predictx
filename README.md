# PredictX

Onchain prediction market on Base Sepolia. Users create markets around X (Twitter) metrics, place bets, and markets are automatically resolved via Chainlink CRE workflows.

## Project Structure

| Folder | Description |
|--------|-------------|
| `contracts/` | Solidity smart contracts (Foundry). MarketRegistry, BettingPool, and MarketResolution. |
| `cre-workflow/` | Chainlink CRE workflow that periodically checks and resolves markets by fetching X API data with DON consensus. |
| `web/` | Next.js frontend. Market browsing, creation, betting UI, and admin panel. Uses wagmi + viem for onchain interaction and Neon Postgres for stats tracking. |

## Chainlink CRE Usage and Smart Contracts description

| File | CRE Component | What it does |
|------|---------------|--------------|
| `cre-workflow/resolve-market/main.ts` | `CronCapability` | Triggers market resolution checks every 15 min |
| `cre-workflow/resolve-market/main.ts` | `EVMClient` | Reads market data from MarketRegistry and submits signed reports to MarketResolution |
| `cre-workflow/resolve-market/main.ts` | `HTTPClient` | Fetches X API data from within the DON |
| `cre-workflow/resolve-market/main.ts` | `consensusMedianAggregation` | Aggregates API responses across nodes using median |
| `cre-workflow/resolve-market/main.ts` | `runtime.report()` | Signs resolution payload (ECDSA + keccak256) for onchain verification |
| `cre-workflow/resolve-market/main.ts` | `Runner` | Initializes and executes the workflow |
| `cre-workflow/project.yaml` | Project config | RPC and account config for Base Sepolia |
| `cre-workflow/resolve-market/workflow.yaml` | Workflow config | Staging/production target definitions |
| `cre-workflow/secrets.yaml` | Secrets | Manages `X_API_BEARER_TOKEN` for the DON |
| `contracts/src/MarketResolution.sol` | `ReceiverTemplate` | Receives signed CRE reports via KeystoneForwarder and resolves markets |
| `contracts/src/interfaces/ReceiverTemplate.sol` | `IReceiver` | Base contract for CRE report reception with forwarder validation |

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Foundry](https://book.getfoundry.sh/) for smart contract development
- [Bun](https://bun.sh/) for CRE workflow

### Install

```bash
pnpm install
```

### Environment Variables

Copy the example files and fill in values:

```bash
cp .env.example .env
cp contracts/.env.example contracts/.env
cp web/.env.local.example web/.env.local
```

**`contracts/.env`**

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer wallet private key |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC endpoint |
| `BASESCAN_API_KEY` | Basescan API key for contract verification |
| `KEYSTONE_FORWARDER` | Chainlink KeystoneForwarder contract address |

**`web/.env.local`**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect / Reown project ID |
| `NEXT_PUBLIC_MARKET_REGISTRY` | Deployed MarketRegistry contract address |
| `NEXT_PUBLIC_BETTING_POOL` | Deployed BettingPool contract address |
| `NEXT_PUBLIC_MARKET_RESOLUTION` | Deployed MarketResolution contract address |
| `DATABASE_URL` | Neon Postgres connection string |
| `TWITTER_BEARER_TOKEN` | X API v2 bearer token (server-side stats collection) |
| `CRON_SECRET` | Secret for authenticating cron job requests |

**`cre-workflow/.env`**

| Variable | Description |
|----------|-------------|
| `CRE_ETH_PRIVATE_KEY` | Private key for CRE workflow execution |
| `CRE_TARGET` | Workflow target (`staging-settings` or `production-settings`) |
| `X_API_BEARER_TOKEN` | X API v2 bearer token (used by DON nodes) |

### Contracts

```bash
# run tests
pnpm test:contracts

# deploy
pnpm deploy:contracts
```

### Web

```bash
# run database migrations
cd web && pnpm db:push

# start dev server
pnpm dev
```

### CRE Workflow

```bash
cd cre-workflow/resolve-market
bun install
```

Refer to [Chainlink CRE docs](https://docs.chain.link/) for deploying workflows to the DON.

## Example Commands

All examples use Foundry's `cast` CLI. Set these variables first:

```bash
export RPC=https://sepolia.base.org
export REGISTRY=<MarketRegistry address>
export POOL=<BettingPool address>
export RESOLUTION=<MarketResolution address>
export USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Create a Market (owner only)

```bash
# Will @elonmusk reach 200M followers? (7-day betting window, 14-day resolution)
cast send $REGISTRY "createMarket(string,string,string,uint256,uint8,uint48,uint48)" \
  "Will @elonmusk reach 200M followers?" \
  "users/by/username/elonmusk?user.fields=public_metrics" \
  "data.public_metrics.followers_count" \
  200000000 \
  0 \
  $(cast --to-uint256 $(($(date +%s) + 604800))) \
  $(cast --to-uint256 $(($(date +%s) + 1209600))) \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

Comparison operators: `0` = GreaterThanOrEqual, `1` = LessThanOrEqual, `2` = GreaterThan, `3` = LessThan, `4` = Equal

### Place a Bet

```bash
# Approve USDC spend first
cast send $USDC "approve(address,uint256)" $POOL 5000000 \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# Place a 5 USDC YES bet on market 0 (side: 0 = Yes, 1 = No)
cast send $POOL "placeBet(uint256,uint8,uint256)" 0 0 5000000 \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

### Read Market State

```bash
# Get market details
cast call $REGISTRY "getMarket(uint256)" 0 --rpc-url $RPC

# Get pool totals
cast call $POOL "getPool(uint256)" 0 --rpc-url $RPC

# Get your position
cast call $POOL "getPosition(uint256,address)" 0 <your-address> --rpc-url $RPC

# Calculate potential payout for a 10 USDC YES bet
cast call $POOL "calculatePotentialPayout(uint256,uint8,uint256)" 0 0 10000000 --rpc-url $RPC

# Get total number of markets
cast call $REGISTRY "nextMarketId()" --rpc-url $RPC
```

### Cancel a Market (owner only)

```bash
cast send $REGISTRY "cancelMarket(uint256)" 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

### Claim Winnings (after resolution)

```bash
cast send $POOL "claim(uint256)" 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

### Refund (after cancellation)

```bash
cast send $POOL "refund(uint256)" 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

### Resolve Markets (via CRE Workflow)

Markets are resolved by the Chainlink CRE workflow. Simulate locally and broadcast the result onchain:

```bash
cd cre-workflow/resolve-market
bun install

# Simulate and broadcast resolution onchain
cre workflow simulate --target=staging-settings --broadcast
```

```bash
# Check resolution result for a market
cast call $RESOLUTION "getResolution(uint256)" 0 --rpc-url $RPC

# Get outcome (true = target met, false = not met)
cast call $RESOLUTION "getOutcome(uint256)" 0 --rpc-url $RPC
```
