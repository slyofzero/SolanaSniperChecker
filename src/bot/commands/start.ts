import { BOT_USERNAME } from "@/utils/env";
import { errorHandler } from "@/utils/handlers";
import { CommandContext, Context } from "grammy";

export async function startBot(ctx: CommandContext<Context>) {
  const text = `*Welcome to ${BOT_USERNAME}!!!*\n\n`;
  ctx.reply(text, { parse_mode: "Markdown" }).catch((e) => errorHandler(e));
}
