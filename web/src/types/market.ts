export enum MarketStatus {
  Open = 0,
  Closed = 1,
  Resolved = 2,
  Cancelled = 3,
}

export enum BetSide {
  Yes = 0,
  No = 1,
}

export enum ComparisonOperator {
  GreaterThanOrEqual = 0,
  LessThanOrEqual = 1,
  GreaterThan = 2,
  LessThan = 3,
  Equal = 4,
}

export interface Market {
  id: number;
  description: string;
  endpointPath: string;
  jsonPath: string;
  targetValue: bigint;
  operator: ComparisonOperator;
  bettingDeadline: number;
  resolutionDate: number;
  createdAt: number;
  status: MarketStatus;
  creator: `0x${string}`;
}

export interface MarketPool {
  totalYesAmount: bigint;
  totalNoAmount: bigint;
}

export interface UserPosition {
  yesAmount: bigint;
  noAmount: bigint;
  claimed: boolean;
  refunded: boolean;
}

export interface Resolution {
  marketId: bigint;
  actualValue: bigint;
  targetMet: boolean;
  resolvedAt: number;
}
