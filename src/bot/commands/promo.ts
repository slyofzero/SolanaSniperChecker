import { setPromoText } from "@/vars/promo";
import { CommandContext, Context } from "grammy";

export async function promo(ctx: CommandContext<Context>) {
  const { match } = ctx;

  if (!match) {
    return ctx.reply(
      "No promo text passed, use command like this -\n/promo This is a promo"
    );
  }

  setPromoText(match);
  ctx.reply(`Promo text set as - ${match}`);
}
