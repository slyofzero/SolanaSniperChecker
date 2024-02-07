import { PairData } from "@/types";
import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID, TOKEN_DATA_URL } from "@/utils/env";
import { formatToInternational } from "@/utils/general";
import { errorHandler, log } from "@/utils/handlers";
import { pairsToTrack } from "@/vars/pairs";
import { teleBot } from "..";

export async function cleanUpTokenTracking() {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1e3);
  const tokensToRemove = [];
  log("Token tracking cleanup initiated");

  for (const token in pairsToTrack) {
    const { initialPrice, pastBenchmark, startTime } = pairsToTrack[token];
    const timeDiff = now - startTime;

    if (timeDiff > 24 * 60 * 60) {
      tokensToRemove.push(token);
    } else {
      const data = (await (await fetch(`${TOKEN_DATA_URL}/${token}`)).json())
        .pair as PairData | undefined;

      if (!data) return delete pairsToTrack[token];

      const { priceUsd, baseToken, pairAddress } = data;
      const { symbol, address } = baseToken;

      const currentPrice = Number(priceUsd);
      const exactIncrease = Number((currentPrice / initialPrice).toFixed(2));
      const increase = Math.floor(exactIncrease);

      if (increase > 1 && increase > pastBenchmark) {
        log(`Token increased by ${increase}x`);
        pairsToTrack[token] = {
          initialPrice,
          startTime,
          pastBenchmark: increase,
        };

        // Links
        const tokenLink = `https://solscan.io/token/${address}`;
        const dexScreenerLink = `https://dexscreener.com/solana/${pairAddress}`;
        const dexToolsLink = `https://www.dextools.io/app/en/solana/pair-explorer/${pairAddress}`;
        const birdEyeLink = `https://birdeye.so/token/${address}?chain=solana`;

        const text = `[${hardCleanUpBotMessage(
          symbol
        )}](${tokenLink}) jumped by ${cleanUpBotMessage(
          exactIncrease
        )}x\\!\\!\\!
      
💲 Price when found: $${cleanUpBotMessage(formatToInternational(initialPrice))}
💲 Price now: $${cleanUpBotMessage(formatToInternational(currentPrice))}

Token Contract:
\`${address}\`

📊 [DexTools](${dexToolsLink}) 📊 [BirdEye](${birdEyeLink})
📊 [DexScreener](${dexScreenerLink}) 📊 [SolScan](${tokenLink})`;

        teleBot.api
          .sendMessage(CHANNEL_ID, text, {
            parse_mode: "MarkdownV2",
            // @ts-expect-error Param not found
            disable_web_page_preview: true,
          })
          .then(() => log(`Sent message for ${pairAddress}`))
          .catch((e) => {
            log(text);
            errorHandler(e);
          });
      }
    }
  }

  for (const token of tokensToRemove) {
    delete pairsToTrack[token];
    log(`Removed ${token}`);
  }
}
