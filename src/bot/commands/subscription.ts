import { subscriptionTiers } from "@/vars/subscribers";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function subscription(ctx: CommandContext<Context>) {
  const text = `Subscribe to the bot to receive regular alerts regarding new hype tokens on Solana, in our private channel. Below is the subscription tier list.\n\nFollow through the steps for payment, and at the end you'd be provided with a *one time only* link to join the channel.`;
  let keyboard = new InlineKeyboard();

  for (const tier in subscriptionTiers) {
    const { text, amount } = subscriptionTiers[tier];
    keyboard = keyboard
      .text(`${text} ${amount} SOL`, `subscribe-${tier}`)
      .row();
  }

  ctx.reply(text, { reply_markup: keyboard, parse_mode: "Markdown" });
}
