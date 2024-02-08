import { Bot } from "grammy";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { log } from "./utils/handlers";
import { BOT_TOKEN, DATA_URL, PHOTON_COOKIE, WSS_URL } from "./utils/env";
import { sendAlert } from "./bot/sendAlert";
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { PhotonPairs } from "./types/livePairs";

export const connection = new Connection(clusterApiUrl("mainnet-beta"));
export const metaplex = new Metaplex(connection);

if (!BOT_TOKEN || !WSS_URL || !DATA_URL) {
  log("BOT_TOKEN or WSS_URL or DATA_URL is missing");
  process.exit(1);
}

export const teleBot = new Bot(BOT_TOKEN);
log("Bot instance ready");

(async function () {
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  async function toRepeat() {
    const response = await fetch(DATA_URL || "", {
      headers: { Cookie: `_photon_ta=${PHOTON_COOKIE}` },
    });

    const pairs = (await response.json()) as PhotonPairs;
    sendAlert(pairs.data);

    setTimeout(toRepeat, 10 * 1e3);
  }

  toRepeat();
})();
