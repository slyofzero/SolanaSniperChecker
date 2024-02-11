import { Bot } from "grammy";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { log } from "./utils/handlers";
import { BOT_TOKEN, DATA_URL, PHOTON_COOKIE } from "./utils/env";
import { sendAlert } from "./bot/sendAlert";
import { PhotonPairs } from "./types/livePairs";
import { rpcConfig } from "./rpc";
import { cleanUpHypePairs } from "./bot/cleanUpHypePairs";

if (!BOT_TOKEN || !DATA_URL) {
  log("BOT_TOKEN or WSS_URL or DATA_URL is missing");
  process.exit(1);
}

export const teleBot = new Bot(BOT_TOKEN);
log("Bot instance ready");

(async function () {
  rpcConfig();
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  async function toRepeat() {
    const response = await fetch(DATA_URL || "", {
      headers: { Cookie: `_photon_ta=${PHOTON_COOKIE}` },
    });

    const pairs = (await response.json()) as PhotonPairs;
    await sendAlert(pairs.data);
    cleanUpHypePairs();

    setTimeout(toRepeat, 30 * 1e3);
  }

  toRepeat();
})();
