import { baseSepolia } from "wagmi/chains";

export const CHAIN = baseSepolia;

// Contract addresses - update after deployment
export const CONTRACTS = {
  MarketRegistry: (process.env.NEXT_PUBLIC_MARKET_REGISTRY ?? "0x") as `0x${string}`,
  BettingPool: (process.env.NEXT_PUBLIC_BETTING_POOL ?? "0x") as `0x${string}`,
  MarketResolution: (process.env.NEXT_PUBLIC_MARKET_RESOLUTION ?? "0x") as `0x${string}`,
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
} as const;

export const USDC_DECIMALS = 6;
