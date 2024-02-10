import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { teleBot } from "..";
import { hypeNewPairs } from "@/vars/tokens";
import { errorHandler, log } from "@/utils/handlers";
import { formatToInternational } from "@/utils/general";
import { PhotonPairData } from "@/types/livePairs";
import { promoText } from "@/vars/promo";

export async function trackMC(pair: PhotonPairData) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const { fdv: marketCap, address, tokenAddress, symbol } = pair.attributes;
  const { initialMC, pastBenchmark, ...rest } = hypeNewPairs[tokenAddress];
  const currentMC = Number(marketCap);

  if (initialMC === 0 && currentMC > 0) {
    log(`Token ${tokenAddress} got a non-zero price`);
    hypeNewPairs[tokenAddress] = {
      initialMC: currentMC,
      pastBenchmark: 1,
      ...rest,
    };
  } else {
    const exactIncrease = Number((currentMC / initialMC).toFixed(2));
    const increase = Math.floor(exactIncrease);

    if (increase > 1 && increase > pastBenchmark) {
      log(`Token ${tokenAddress} increased by ${increase}x`);
      hypeNewPairs[tokenAddress] = {
        initialMC,
        pastBenchmark: increase,
        ...rest,
      };

      // Links
      const tokenLink = `https://solscan.io/token/${tokenAddress}`;
      const dexScreenerLink = `https://dexscreener.com/solana/${address}`;
      const birdEyeLink = `https://birdeye.so/token/${tokenAddress}?chain=solana`;

      const text = `Powered By [Solana Hype Alerts](https://t.me/SolanaHypeTokenAlerts)

[${hardCleanUpBotMessage(symbol)}](${tokenLink}) jumped by ${cleanUpBotMessage(
        exactIncrease
      )}x\\!\\!\\!
      
💲 MC when found: $${cleanUpBotMessage(formatToInternational(initialMC))}
💲 MC now: $${cleanUpBotMessage(formatToInternational(currentMC))}

Token Contract:
\`${tokenAddress}\`

[DexScreener](${dexScreenerLink}) \\| [BirdEye](${birdEyeLink})${promoText}`;

      teleBot.api
        .sendMessage(CHANNEL_ID, text, {
          parse_mode: "MarkdownV2",
          // @ts-expect-error Param not found
          disable_web_page_preview: true,
        })
        .then(() => log(`Sent message for ${address}`))
        .catch((e) => {
          log(text);
          errorHandler(e);
        });
    }
  }
}
