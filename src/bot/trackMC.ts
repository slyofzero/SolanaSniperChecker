import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { teleBot } from "..";
import { hypeNewPairs } from "@/vars/tokens";
import { errorHandler, log } from "@/utils/handlers";
import { formatToInternational } from "@/utils/general";
import { promoText } from "@/vars/promo";
import { apiFetcher } from "@/utils/api";
import { PairDataResponse } from "@/types";

export async function trackMC() {
  try {
    if (!CHANNEL_ID) {
      log("CHANNEL_ID is undefined");
      process.exit(1);
    }

    for (const token in hypeNewPairs) {
      const pairData = (
        await apiFetcher(
          `https://api.dexscreener.com/latest/dex/tokens/${token}`
        )
      ).data as PairDataResponse;

      const firstPair = pairData.pairs?.at(0);

      if (!firstPair) return delete hypeNewPairs[token];

      const {
        fdv: marketCap,
        pairAddress: address,
        baseToken,
        liquidity,
      } = firstPair;
      const { address: tokenAddress, symbol } = baseToken;

      const { initialMC, pastBenchmark, launchMessage, ...rest } =
        hypeNewPairs[token];
      const currentMC = Number(marketCap);

      if (initialMC === 0 && currentMC > 0) {
        log(`Token ${tokenAddress} got a non-zero price`);
        hypeNewPairs[token] = {
          initialMC: currentMC,
          pastBenchmark: 1,
          launchMessage,
          ...rest,
        };
      } else {
        const exactIncrease = Number((currentMC / initialMC).toFixed(2));
        const increase = Math.floor(exactIncrease);

        if (increase > 1 && increase > pastBenchmark && liquidity.usd >= 1000) {
          log(`Token ${tokenAddress} increased by ${increase}x`);
          hypeNewPairs[token] = {
            initialMC,
            pastBenchmark: increase,
            launchMessage,
            ...rest,
          };

          // Links
          const tokenLink = `https://solscan.io/token/${tokenAddress}`;
          const dexScreenerLink = `https://dexscreener.com/solana/${address}`;
          const birdEyeLink = `https://birdeye.so/token/${tokenAddress}?chain=solana`;
          const photonLink = `https://photon-sol.tinyastro.io/en/r/@solhypealerts/${tokenAddress}`;

          const text = `*[TOOLS AI FOMO ALERT GAINS \\(SOL\\)](https://t.me/ToolsAiFomoAlerts_Solana)*

🚀 [${hardCleanUpBotMessage(
            symbol
          )}](${tokenLink}) soared by ${cleanUpBotMessage(exactIncrease)}x\\!

\\- MC when found: $${cleanUpBotMessage(formatToInternational(initialMC))}
\\- MC now: $${cleanUpBotMessage(formatToInternational(currentMC))}

Track with:
\\- [Photon](${photonLink})
\\- [DexScreener](${dexScreenerLink})
\\- [BirdEye](${birdEyeLink})${promoText}`;

          teleBot.api
            .sendMessage(CHANNEL_ID, text, {
              parse_mode: "MarkdownV2",
              // @ts-expect-error Param not found
              disable_web_page_preview: true,
              reply_parameters: { message_id: launchMessage },
            })
            .then(() => log(`Sent message for ${address}`))
            .catch((e) => {
              log(text);
              errorHandler(e);
            });
        }
      }
    }
  } catch (error) {
    errorHandler(error);
  }
}
