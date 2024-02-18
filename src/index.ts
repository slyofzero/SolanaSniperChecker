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
  teleBot.start({ allowed_updates: ["chat_member"] });
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  await Promise.all([syncSubscribers()]);

  async function toRepeat() {
    try {
      const response = await fetch(DATA_URL || "", {
        headers: { Cookie: `_photon_ta=${PHOTON_COOKIE}` },
      });

      const pairs = (await response.json()) as PhotonPairs;
      await sendAlert(pairs.data);
      trackMC();
    } catch (error) {
      errorHandler(error);
    } finally {
      setTimeout(toRepeat, 60 * 1e3);
    }

    setInterval(cleanUpHypePairs, 60 * 60 * 1e3);
  }

  toRepeat();
})();
