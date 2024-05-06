import puppeteerExtra, { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Bot, type Context, MemorySessionStorage } from "grammy";
import { type ChatMember } from "grammy/types";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { errorHandler, log } from "./utils/handlers";
import { BOT_TOKEN, DATA_URL, PHOTON_COOKIE } from "./utils/env";
import { sendAlert } from "./bot/sendAlert";
import { PhotonPairs } from "./types/livePairs";
import { rpcConfig } from "./rpc";
import { cleanUpHypePairs } from "./bot/cleanUpHypePairs";
import { trackMC } from "./bot/trackMC";
import { chatMembers, type ChatMembersFlavor } from "@grammyjs/chat-members";
import { syncSubscribers } from "./vars/subscribers";
import { cleanUpSubscriptions } from "./bot/cleanUpSubscriptions";
import { unlockUnusedAccounts } from "./bot/unlockUnusedAccounts";

const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;
puppeteer.use(StealthPlugin());

async function getData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const headers = {
    Cookie: `_photon_ta=${PHOTON_COOKIE}`,
  };
  await page.setExtraHTTPHeaders(headers);
  const response = await page.goto(DATA_URL || "", {
    waitUntil: "networkidle0",
  });

  const text = JSON.parse((await response?.text()) || "[]");
  await browser.close();
  return text as PhotonPairs;
}

if (!BOT_TOKEN || !DATA_URL) {
  log("BOT_TOKEN or WSS_URL or DATA_URL is missing");
  process.exit(1);
}

type MyContext = Context & ChatMembersFlavor;
const adapter = new MemorySessionStorage<ChatMember>();
export const teleBot = new Bot<MyContext>(BOT_TOKEN);
log("Bot instance ready");
teleBot.use(chatMembers(adapter));

(async function () {
  rpcConfig();
  await Promise.all([syncSubscribers()]);

  teleBot.start({
    allowed_updates: ["chat_member", "message", "callback_query"],
  });
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  async function toRepeat() {
    try {
      const pairs = await getData();
      await sendAlert(pairs.data);
      trackMC();
    } catch (error) {
      errorHandler(error);
    } finally {
      setTimeout(toRepeat, 60 * 1e3);
    }
  }

  toRepeat();
  setInterval(() => {
    cleanUpHypePairs();
    cleanUpSubscriptions();
    unlockUnusedAccounts();
  }, 60 * 60 * 1e3);
})();

// import { PublicKey } from "@solana/web3.js";
// import { getDocument } from "./firebase";
// import { rpcConfig, solanaConnection } from "./rpc";
// import { StoredAccount } from "./types/accounts";

// (async () => {
//   rpcConfig();
//   const accounts = (await getDocument({
//     collectionName: "accounts",
//   })) as StoredAccount[];

//   accounts.forEach(async ({ publicKey }) => {
//     const pubKey = new PublicKey(publicKey);
//     const balance = await solanaConnection.getBalance(pubKey);

//     if (balance > 0) {
//       console.log(publicKey);
//     }
//   });
// })();
