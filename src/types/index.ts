/** Shared shapes for the loyalty club. Mirrors the jsonb returned by the RPCs. */

export type MemberTier = "basic" | "member";

/** What the customer portal knows about the person holding the card. */
export interface MemberCard {
  cardToken: string;
  fullName: string;
  nationalId: string;
  pointsBalance: number;
  tier: MemberTier;
  /** True once the card is attached to a Supabase auth account. */
  linked: boolean;
  /** Signed `DT1.<token>.<tag>` string — the actual QR contents. */
  qrPayload: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  memberOnly: boolean;
  redeemable: boolean;
}

export type TransactionKind = "earn" | "redeem" | "adjust";

export interface LedgerEntry {
  id: string;
  kind: TransactionKind;
  points: number;
  purchaseAmount: number | null;
  createdAt: string;
  rewardName: string | null;
}

/** What the barista sees after a successful scan. */
export interface ScanResult {
  cardToken: string;
  fullName: string;
  pointsBalance: number;
  tier: MemberTier;
  memberSince: string;
  rewards: Reward[];
  history: LedgerEntry[];
}

export interface PointsMutationResult {
  fullName: string;
  pointsBalance: number;
  pointsAwarded?: number;
  pointsSpent?: number;
  rewardName?: string;
  replayed: boolean;
}

/** Uniform error envelope returned by every route handler in /api. */
export interface ApiError {
  error: string;
  message: string;
}
