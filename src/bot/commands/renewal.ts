import { errorHandler } from "@/utils/handlers";
import { subscribers, renewalSubscriptionTiers } from "@/vars/subscribers";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function renewal(ctx: CommandContext<Context>) {
  try {
    const from = ctx.from;
    if (!from) {
      return await ctx.reply("Please do /renew again");
    }

    const userId = from.id;
    const userSubscription = subscribers.find(
      ({ user, status }) => user === userId && status === "PAID"
    );

    if (userSubscription) {
      const text = `Renew your subscription beforehand to keep staying in the private channel. The days you subscribe for would be added to your active subscription. Below is the subscription tier list.\n\nFollow through the steps for payment, and at the end you'd be provided with a *one time only* link to join the channel.`;
      let keyboard = new InlineKeyboard();

      for (const tier in renewalSubscriptionTiers) {
        const { text, amount } = renewalSubscriptionTiers[tier];
        keyboard = keyboard
          .text(`${text} ${amount} SOL`, `subscribe-${tier}`)
          .row();
      }

      ctx
        .reply(text, { reply_markup: keyboard, parse_mode: "Markdown" })
        .catch((e) => errorHandler(e));
    } else {
      const text = `You don't have an active subscription to renew. Do /subscribe to subscribe first.`;
      ctx.reply(text).catch((e) => errorHandler(e));
    }
  } catch (error) {
    errorHandler(error);
    ctx.reply("An error occurred, please try again");
  }
}
