import { getDocument } from "@/firebase";
import { Subscriber, SubscriptionTier } from "@/types/subscriber";
import { log } from "@/utils/handlers";

export let subscribers: Subscriber[] = [];
export const subscriptionTiers: { [key: number]: SubscriptionTier } = {
  1: { amount: 0.35, days: 7, text: "1 week" },
  2: { amount: 1, days: 30, text: "1 month" },
  3: { amount: 2.5, days: 90, text: "3 months" },
  4: { amount: 4, days: 180, text: "6 months" },
  5: { amount: 6.5, days: 365, text: "12 months" },
  6: { amount: 11.5, days: 99999, text: "Lifetime" },
};

export async function syncSubscribers() {
  const storedSubscribers = (await getDocument({
    collectionName: "subscribers",
  })) as Subscriber[];
  subscribers = storedSubscribers;
  log("Synced subscribers with firebase");
}
