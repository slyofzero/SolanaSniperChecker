import { getDocument } from "@/firebase";
import { Subscriber } from "@/types/subscriber";
import { log } from "@/utils/handlers";

export let subscribers: Subscriber[] = [];

export async function syncSubscribers() {
  const storedSubscribers = (await getDocument({
    collectionName: "subscribers",
  })) as Subscriber[];
  subscribers = storedSubscribers;
  log("Synced subscribers with firebase");
}
