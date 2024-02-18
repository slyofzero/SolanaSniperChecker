import { Timestamp } from "firebase-admin/firestore";

export interface Subscriber {
  user: number;
  paymentDate: Timestamp;
  expiryDate: Timestamp;
  status: "PENDING" | "PAID" | "EXPIRED";
  paidTo: string;
}
