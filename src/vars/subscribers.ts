import { getDocument } from "@/firebase";
import { Subscriber, SubscriptionTier } from "@/types/subscriber";
import { log } from "@/utils/handlers";

export let subscribers: Subscriber[] = [];

export const subscriptionTiers: { [key: number]: SubscriptionTier } = {
  1: { amount: 0.45, days: 7, text: "1 week" },
  2: { amount: 1.17, days: 30, text: "1 month" },
  3: { amount: 2.8, days: 90, text: "3 months" },
  4: { amount: 4.7, days: 180, text: "6 months" },
  5: { amount: 7.9, days: 365, text: "12 months" },
  6: { amount: 13, days: 99999, text: "Lifetime" },
};

export const renewalSubscriptionTiers: { [key: number]: SubscriptionTier } = {
  1: { amount: 0.42, days: 7, text: "1 week" },
  2: { amount: 1.12, days: 30, text: "1 month" },
  3: { amount: 2.73, days: 90, text: "3 months" },
  4: { amount: 4.43, days: 180, text: "6 months" },
  5: { amount: 7.15, days: 365, text: "12 months" },
  6: { amount: 12.2, days: 99999, text: "Lifetime" },
};

export async function syncSubscribers() {
  const storedSubscribers = (await getDocument({
    collectionName: "subscribers",
  })) as Subscriber[];
  subscribers = storedSubscribers;
  log("Synced subscribers with firebase");
}
