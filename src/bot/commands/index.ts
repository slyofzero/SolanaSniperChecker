import { teleBot } from "@/index";
import { startBot } from "./start";
import { errorHandler, log } from "@/utils/handlers";
import { promo } from "./promo";
import { subscribers } from "@/vars/subscribers";
import { CHANNEL_ID } from "@/utils/env";
import { subscription } from "./subscription";
import { renewal } from "./renewal";

export function initiateBotCommands() {
  teleBot.api
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      // { command: "promo", description: "Set a promo text" },
      { command: "subscribe", description: "To subscribe to the bot" },
      { command: "renew", description: "To renew your ongoing subscription" },
    ])
    .catch((e) => errorHandler(e));

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("promo", (ctx) => promo(ctx));
  teleBot.command("subscribe", (ctx) => subscription(ctx));
  teleBot.command("renew", (ctx) => renewal(ctx));

  teleBot.on("chat_member", async (ctx) => {
    if (!CHANNEL_ID) {
      return log("CHANNEL_ID is undefined");
    }

    const member = ctx.from;
    const channelId = ctx.update.chat_member.chat.id;
    const isPrivateChannel = channelId === Number(CHANNEL_ID);

    const userSubscription = subscribers.find(
      ({ user, status }) => user === member.id && status === "PAID"
    );

    const shouldBanUser =
      isPrivateChannel && !member.is_bot && !userSubscription;

    if (shouldBanUser) {
      ctx.banChatMember(member.id).catch((e) => errorHandler(e));
      log(`Banned ${member.id}`);
    }
  });

  log("Bot commands up");
}
