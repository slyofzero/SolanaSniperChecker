import { updateDocumentById } from "@/firebase";
import { transactionValidTime } from "@/utils/constants";
import { errorHandler, log } from "@/utils/handlers";
import { getSecondsElapsed } from "@/utils/time";
import { subscribers, syncSubscribers } from "@/vars/subscribers";

export async function cleanUpSubscriptions() {
  log("Initiated subscription cleanup");

  for (const subscriber of subscribers) {
    try {
      const { paidAt, status, expiresAt, id } = subscriber;

      const secondsTillPaymentGeneration = getSecondsElapsed(paidAt?.seconds);
      const currentTime = Math.floor(new Date().getTime() / 1e3);

      if (
        (secondsTillPaymentGeneration > transactionValidTime &&
          status === "PENDING") ||
        (expiresAt && currentTime > expiresAt.seconds && status === "PAID")
      ) {
        await updateDocumentById({
          updates: { status: "EXPIRED" },
          collectionName: "advertisements",
          id: id || "",
        });
        log(`Advertisement ${id} expired`);

        await syncSubscribers();
      }
    } catch (error) {
      errorHandler(error);
    }
  }
}
