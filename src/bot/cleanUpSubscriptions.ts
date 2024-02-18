import { updateDocumentById } from "@/firebase";
import { transactionValidTime } from "@/utils/constants";
import { errorHandler, log } from "@/utils/handlers";
import { getSecondsElapsed } from "@/utils/time";
import { subscribers, syncSubscribers } from "@/vars/subscribers";
import { teleBot } from "..";
import { CHANNEL_ID } from "@/utils/env";

export async function cleanUpSubscriptions() {
  if (!CHANNEL_ID) {
    return log("CHANNEL_ID is undefined");
  }
  log("Initiated subscription cleanup");

  for (const subscriber of subscribers) {
    try {
      const { paidAt, status, expiresAt, id, user } = subscriber;
      const secondsTillPaymentGeneration = getSecondsElapsed(paidAt?.seconds);
      const currentTime = Math.floor(new Date().getTime() / 1e3);

      if (
        (secondsTillPaymentGeneration > transactionValidTime &&
          status === "PENDING") ||
        (expiresAt && currentTime > expiresAt.seconds && status === "PAID")
      ) {
        updateDocumentById({
          updates: { status: "EXPIRED" },
          collectionName: "subscribers",
          id: id || "",
        }).then(() => {
          syncSubscribers();
          teleBot.api.banChatMember(CHANNEL_ID || "", user);
        });
        log(`Subscription ${id} expired`);
      }
    } catch (error) {
      errorHandler(error);
    }
  }
}
