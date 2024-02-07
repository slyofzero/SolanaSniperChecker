import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { teleBot } from "..";
import { log } from "console";
import { PairData } from "@/types";
import { hypeNewPairs } from "@/vars/tokens";
import { errorHandler } from "@/utils/handlers";
import { formatToInternational } from "@/utils/general";

export async function trackMC(pair: PairData) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const { baseToken, marketCap, pairAddress } = pair;
  const { address, symbol } = baseToken;

  const { initialMC, pastBenchmark, startTime } = hypeNewPairs[address];

  const currentMC = Number(marketCap);

  if (initialMC === 0 && currentMC > 0) {
    log(`Token ${address} got a non-zero price`);
    hypeNewPairs[address] = {
      initialMC: currentMC,
      startTime,
      pastBenchmark: 1,
    };
  } else {
    const exactIncrease = Number((currentMC / initialMC).toFixed(2));
    const increase = Math.floor(exactIncrease);

    if (increase > 1 && increase > pastBenchmark) {
      log(`Token ${address} increased by ${increase}x`);
      hypeNewPairs[address] = {
        initialMC,
        startTime,
        pastBenchmark: increase,
      };

      // Links
      const tokenLink = `https://solscan.io/token/${address}`;
      const pairLink = `https://solscan.io/account/${pairAddress}`;
      const dexScreenerLink = `https://dexscreener.com/solana/${pairAddress}`;
      const dexToolsLink = `https://www.dextools.io/app/en/solana/pair-explorer/${pairAddress}`;
      const birdEyeLink = `https://birdeye.so/token/${address}?chain=solana`;

      const text = `[${hardCleanUpBotMessage(
        symbol
      )}](${tokenLink}) jumped by ${cleanUpBotMessage(exactIncrease)}x\\!\\!\\!
      
💲 MC when found: $${cleanUpBotMessage(formatToInternational(initialMC))}
💲 MC now: $${cleanUpBotMessage(formatToInternational(currentMC))}

Token Contract:
\`${address}\`

📊 [DexTools](${dexToolsLink}) 📊 [BirdEye](${birdEyeLink})
📊 [DexScreener](${dexScreenerLink}) 📊 [SolScan](${pairLink})`;

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
