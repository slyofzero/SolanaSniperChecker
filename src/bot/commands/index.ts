import { teleBot } from "@/index";
import { startBot } from "./start";
import { log } from "@/utils/handlers";
import { promo } from "./promo";
import { subscribers } from "@/vars/subscribers";
import { CHANNEL_ID } from "@/utils/env";

export function initiateBotCommands() {
  teleBot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "promo", description: "Set a promo text" },
  ]);

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("promo", (ctx) => promo(ctx));

  teleBot.on("chat_member", async (ctx) => {
    if (!CHANNEL_ID) {
      return log("CHANNEL_ID is undefined");
    }

    const member = ctx.from;

    const userSubscription = subscribers.find(({ user }) => user === member.id);
    const shouldBanUser =
      !member.is_bot &&
      (!userSubscription || userSubscription.status !== "PAID");

    if (shouldBanUser) {
      ctx.banChatMember(member.id);
      log(`Banned ${member.id}`);
    }
  });

  log("Bot commands up");
}
