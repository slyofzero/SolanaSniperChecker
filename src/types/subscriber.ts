import { Timestamp } from "firebase-admin/firestore";

export interface Subscriber {
  id?: string;
  user: number;
  status: "PENDING" | "PAID" | "EXPIRED";
  renewalStatus?: "PENDING" | "PAID" | "EXPIRED";
  paidTo: string;
  tier: number;
  renewalTier?: number;
  paidAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface SubscriptionTier {
  amount: number;
  days: number;
  text: string;
}
