import { subscribers, subscriptionTiers } from "@/vars/subscribers";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function subscription(ctx: CommandContext<Context>) {
  const from = ctx.from;
  if (!from) {
    return ctx.reply("Please do /subscribe again");
  }

  const userId = from.id;
  const userSubscription = subscribers.find(
    ({ user, status }) => user === userId && status === "PAID"
  );

  if (!userSubscription) {
    const text = `Subscribe to the bot to receive regular alerts regarding new hype tokens on Solana, in our private channel. Below is the subscription tier list.\n\nFollow through the steps for payment, and at the end you'd be provided with a *one time only* link to join the channel.`;
    let keyboard = new InlineKeyboard();

    for (const tier in subscriptionTiers) {
      const { text, amount } = subscriptionTiers[tier];
      keyboard = keyboard
        .text(`${text} ${amount} SOL`, `subscribe-${tier}`)
        .row();
    }

    ctx.reply(text, { reply_markup: keyboard, parse_mode: "Markdown" });
  } else {
    const { tier, expiresAt } = userSubscription;
    const userTier = subscriptionTiers[tier];
    const formattedDate = expiresAt?.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const text = `You have an active subscription for ${userTier.text}, subscription expires on ${formattedDate}`;
    ctx.reply(text);
  }
}
