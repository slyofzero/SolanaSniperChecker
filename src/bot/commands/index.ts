import { teleBot } from "@/index";
import { startBot } from "./start";
import { log } from "@/utils/handlers";
import { promo } from "./promo";

export function initiateBotCommands() {
  teleBot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "promo", description: "Set a promo text" },
  ]);
  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("promo", (ctx) => promo(ctx));
  log("Bot commands up");
}
