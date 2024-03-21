import { getDocument, getDocumentById, updateDocumentById } from "@/firebase";
import { StoredAccount } from "@/types/accounts";
import { Subscriber } from "@/types/subscriber";
import { transactionValidTime } from "@/utils/constants";
import { decrypt } from "@/utils/cryptography";
import { getSecondsElapsed, sleep } from "@/utils/time";
import { CallbackQueryContext, Context } from "grammy";
import web3, { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { errorHandler, log } from "@/utils/handlers";
import { solanaConnection } from "@/rpc";
import { Timestamp } from "firebase-admin/firestore";
import {
  subscribers,
  renewalSubscriptionTiers,
  syncSubscribers,
  subscriptionTiers,
} from "@/vars/subscribers";
import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { BOT_INVITE_LINK, CHANNEL_ID } from "@/utils/env";
import { teleBot } from "@/index";
import { replicate } from "@/utils/general";

export async function confirmPayment(ctx: CallbackQueryContext<Context>) {
  try {
    if (!CHANNEL_ID) {
      return log("CHANNEL_ID is undefined");
    }

    const from = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    const hash = callbackData.split("-").at(-1);

    if (!from || !callbackData || !hash) {
      return await ctx.reply("Please click on the button again");
    }

    const userId = from.id;
    const userSubscriptions = subscribers.filter(
      ({ user, status }) => user == userId && status === "PAID"
    );
    const subscription = replicate(userSubscriptions.at(0) || {}) as Subscriber;
    const { id } = subscription;
    const isSubscribed = userSubscriptions.length > 0;

    const subscriberData =
      ((await getDocumentById({
        collectionName: "subscribers",
        id: isSubscribed ? id || "" : hash,
      })) as Subscriber) || undefined;

    if (!subscriberData) {
      log(`Payment not found for hash ${hash}`);
      return await ctx.reply(
        `Your payment wasn't found. Please contact the admins and provide them the hash - ${hash}.`
      );
    }

    const { paidAt, paidTo, tier, user, renewalTier } = subscriberData;
    const selectedTier =
      isSubscribed && renewalTier
        ? renewalSubscriptionTiers[renewalTier]
        : subscriptionTiers[tier];
    const timeSpent = getSecondsElapsed(paidAt.seconds);

    if (timeSpent > transactionValidTime) {
      log(`Transaction ${hash} has expired`);
      return await ctx.reply(
        `Your payment duration has expired. You were warned not to pay after 20 minutes of payment message generation. If you have already paid, contact the admins.`
      );
    }

    const storedAccount =
      ((
        await getDocument({
          queries: [["publicKey", "==", paidTo]],
          collectionName: "accounts",
        })
      ).at(0) as StoredAccount) || undefined;

    if (!storedAccount) {
      log(`Account for payment hash ${hash} not found`);
      return await ctx.reply(
        `The account your payment was sent to wasn't found. Please contact the admins and provide them the hash - ${hash}.`
      );
    }

    const { id: accountID, secretKey: encryptedSecretKey } = storedAccount;
    const secretKey = decrypt(encryptedSecretKey);
    const account = web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(secretKey))
    );

    const text = `Checking for payment of \`${selectedTier.amount}\` SOL for payment hash \`${hash}\`. You'd be notified as soon as the payment is confirmed.`;
    const confirmingMessage = await ctx.reply(cleanUpBotMessage(text), {
      parse_mode: "MarkdownV2",
    });

    attemptsCheck: for (const attempt_number of Array.from(Array(20).keys())) {
      try {
        log(
          `Checking for subscription payment, Attempt - ${attempt_number + 1}`
        );

        // Checking if payment was made
        const balance = await solanaConnection.getBalance(account.publicKey);
        if (balance < selectedTier.amount * LAMPORTS_PER_SOL) {
          log(`Transaction amount doesn't match`);
          await sleep(30000);
          continue attemptsCheck;
        }

        const logText = `Transaction ${hash} for trend verified with payment of ${selectedTier.amount} SOL`;
        log(logText);
        const currentTimestamp = Timestamp.now();

        const { renewalStatus, expiresAt } = subscriberData;
        let updateSubscription: Promise<any> | null = null;

        if (renewalStatus === "PENDING" && expiresAt) {
          updateSubscription = updateDocumentById({
            updates: {
              renewalStatus: "PAID",
              paidAt: currentTimestamp,
              expiresAt: new Timestamp(
                expiresAt.seconds + selectedTier.days * 24 * 60 * 60,
                expiresAt.nanoseconds
              ),
            },
            collectionName: "subscribers",
            id: hash,
          });
        } else {
          updateSubscription = updateDocumentById({
            updates: {
              status: "PAID",
              paidAt: currentTimestamp,
              expiresAt: new Timestamp(
                currentTimestamp.seconds + selectedTier.days * 24 * 60 * 60,
                currentTimestamp.nanoseconds
              ),
            },
            collectionName: "subscribers",
            id: hash,
          });
        }

        // const unlockAccount = updateDocumentById({
        //   updates: { locked: false },
        //   collectionName: "accounts",
        //   id: accountID || "",
        // });

        // splitPayment(secretKey, balance)
        //   .then(() => log("Amount split between share holders"))
        //   .catch((e) => errorHandler(e));

        const confirmationText = `Confirmed payment of \`${cleanUpBotMessage(
          selectedTier.amount
        )}\` SOL for a subscription of ${cleanUpBotMessage(
          selectedTier.text
        )}\\. Your payment hash was \`${hash}\`\\. Use the below link to join the private channel \\-\n\n${hardCleanUpBotMessage(
          BOT_INVITE_LINK
        )}`;

        await Promise.all([updateSubscription]);
        syncSubscribers()
          .then(() => {
            teleBot.api.unbanChatMember(CHANNEL_ID || "", user);
            log(`Unbanned user ${user}`);
          })
          .then(() => {
            ctx.reply(confirmationText, {
              parse_mode: "MarkdownV2",
            });
          })
          .then(() => {
            ctx.deleteMessage().catch((e) => errorHandler(e));
            ctx
              .deleteMessages([confirmingMessage.message_id])
              .catch((e) => errorHandler(e));
          })
          .catch((e) => errorHandler(e));

        return true;
      } catch (error) {
        errorHandler(error);
        await sleep(30000);
      }
    }

    const failedText = `Your payment wasn't confirmed. Please contact the admins and provide your payment hash - ${hash}`;
    ctx.reply(failedText).catch((e) => errorHandler(e));
  } catch (error) {
    errorHandler(error);
    ctx.reply(`An error occurred, please try again`);
  }
}
