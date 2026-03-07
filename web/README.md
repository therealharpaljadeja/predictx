# PredictX Web

Next.js frontend for the PredictX prediction market.

**Stack:** Next.js, Wagmi, Viem, shadcn/ui, Drizzle ORM, Neon PostgreSQL

## Pages

- `/` - Browse active markets
- `/market/[id]` - Market detail, bet placement, odds, pool stats
- `/my-bets` - View your positions and claim winnings
- `/admin` - Create and manage markets (owner only)

## API Routes

- `/api/ticker-feed` - Live market ticker data
- `/api/market-stats/[marketId]` - Historical metric snapshots
- `/api/twitter-avatar` - Proxy for X profile images
- `/api/cron/collect-stats` - Cron job that fetches X metrics and stores snapshots in PostgreSQL

## Setup

```bash
pnpm install
cp .env.local.example .env.local  # fill in values
pnpm db:push                      # run migrations
pnpm dev                          # start dev server
```
