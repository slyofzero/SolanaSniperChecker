import { addDocument, getDocument, updateDocumentById } from "@/firebase";
import { StoredAccount } from "@/types/accounts";
import { Subscriber } from "@/types/subscriber";
import { encrypt } from "@/utils/cryptography";
import { errorHandler, log } from "@/utils/handlers";
import { generateAccount } from "@/utils/web3";
import { subscriptionTiers } from "@/vars/subscribers";
import { Timestamp } from "firebase-admin/firestore";
import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";
import { nanoid } from "nanoid";

export async function prepareSubscription(ctx: CallbackQueryContext<Context>) {
  const from = ctx.from;
  const callbackData = ctx.callbackQuery.data;
  const tier = Number(callbackData.split("-").at(-1));

  if (!from || !callbackData || isNaN(tier)) {
    return ctx.reply("Please click on the button again, or do /subscribe");
  }

  const selectedTier = subscriptionTiers[tier];
  const userId = from.id;

  const notLockedAccount =
    ((
      await getDocument({
        collectionName: "accounts",
        queries: [["locked", "!=", true]],
      })
    ).at(0) as StoredAccount) || undefined;

  let publicKey: string = "";
  if (notLockedAccount) {
    publicKey = notLockedAccount.publicKey;
    updateDocumentById({
      id: notLockedAccount.id || "",
      collectionName: "accounts",
      updates: { locked: true, lockedAt: Timestamp.now() },
    });
  } else {
    const newAccount = generateAccount();
    publicKey = newAccount.publicKey;

    const newAccountData: StoredAccount = {
      publicKey,
      secretKey: encrypt(newAccount.secretKey),
      locked: true,
      lockedAt: Timestamp.now(),
    };

    addDocument({ data: newAccountData, collectionName: "accounts" });
  }

  const hash = nanoid(10).replace(/-/g, "a");
  let text = `You have selected subscription for ${selectedTier.text}.
The total cost - \`${selectedTier.amount}\` SOL

Send the bill amount to the below address within 20 minutes, starting from this message generation. Once paid, click on "I have paid" to verify payment. If 20 minutes have already passed then please restart using /subscribe.

Address - \`${publicKey}\``;
  text = text.replace(/\./g, "\\.").replace(/-/g, "\\-");
  const keyboard = new InlineKeyboard().text("I have paid", `payment-${hash}`);

  ctx
    .reply(text, {
      reply_markup: keyboard,
      parse_mode: "MarkdownV2",
    })
    .then(() => ctx.deleteMessage());

  try {
    const paymentData: Subscriber = {
      paidAt: Timestamp.now(),
      paidTo: publicKey,
      tier,
      user: userId,
      status: "PENDING",
    };

    await addDocument({
      data: paymentData,
      collectionName: "subscribers",
      id: hash,
    });

    log(`Pepared payment ${hash}`);

    return true;
  } catch (error) {
    errorHandler(error);
    ctx.reply(
      "An error occurred. Please don't follow with the payment and instead use /advertise again in the same way you used earlier."
    );

    return false;
  }
}
