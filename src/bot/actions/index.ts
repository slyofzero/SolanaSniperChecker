import { teleBot } from "@/index";
import { log } from "@/utils/handlers";
import { prepareSubscription } from "./prepareSubscription";
import { confirmPayment } from "./confirmPayment";

export function initiateCallbackQueries() {
  teleBot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith("subscribe-")) {
      // @ts-expect-error Weird type I don't wanna fill in
      prepareSubscription(ctx);
    } else if (data.startsWith("payment-")) {
      // @ts-expect-error Weird type I don't wanna fill in
      confirmPayment(ctx);
    }
  });

  log("Bot callback queries up");
}
