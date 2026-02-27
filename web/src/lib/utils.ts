import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { USDC_DECIMALS } from "./contracts";
import { MARKET_TYPES } from "./market-types";
import { ComparisonOperator } from "@/types/market";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(amount: bigint): string {
  const num = Number(amount) / 10 ** USDC_DECIMALS;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseUSDC(amount: string): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) return 0n;
  return BigInt(Math.round(num * 10 ** USDC_DECIMALS));
}

export function calculateOdds(yesAmount: bigint, noAmount: bigint): { yes: number; no: number } {
  const total = yesAmount + noAmount;
  if (total === 0n) return { yes: 50, no: 50 };
  return {
    yes: Number((yesAmount * 100n) / total),
    no: Number((noAmount * 100n) / total),
  };
}

export function formatCompactNumber(count: bigint | number): string {
  const n = typeof count === "bigint" ? Number(count) : count;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export const formatFollowers = formatCompactNumber;

export function formatCountdown(targetTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = targetTimestamp - now;
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getMarketTypeLabel(endpointPath: string, jsonPath: string): string {
  const match = MARKET_TYPES.find(
    (t) => jsonPath === t.jsonPath
  );
  return match?.label ?? "Unknown";
}

export function getVerificationUrl(endpointPath: string): { url: string; label: string } | null {
  const usernameMatch = endpointPath.match(/users\/by\/username\/([^?]+)/);
  if (usernameMatch) {
    return { url: `https://x.com/${usernameMatch[1]}`, label: `@${usernameMatch[1]}` };
  }
  const tweetMatch = endpointPath.match(/tweets\/(\d+)/);
  if (tweetMatch) {
    return { url: `https://x.com/i/status/${tweetMatch[1]}`, label: `Tweet ${tweetMatch[1]}` };
  }
  return null;
}

export function formatOperator(op: ComparisonOperator): string {
  switch (op) {
    case ComparisonOperator.GreaterThanOrEqual: return ">=";
    case ComparisonOperator.LessThanOrEqual: return "<=";
    case ComparisonOperator.GreaterThan: return ">";
    case ComparisonOperator.LessThan: return "<";
    case ComparisonOperator.Equal: return "=";
    default: return ">=";
  }
}
