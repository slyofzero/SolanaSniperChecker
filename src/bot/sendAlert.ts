import { PairData } from "@/types";
import { AGE_THRESHOLD, VOLUME_THRESHOLD } from "@/utils/constants";
import { formatToInternational, toTitleCase } from "@/utils/general";
import { hypeNewPairs } from "@/vars/tokens";
import { teleBot } from "..";
import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { errorHandler, log } from "@/utils/handlers";
import moment from "moment";
import { getTokenMetaData } from "@/utils/api";
import { pairsToTrack } from "@/vars/pairs";

export async function sendAlert(pairs: PairData[]) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  for (const pair of pairs) {
    const { baseToken, volume, pairCreatedAt } = pair;
    const { address, name, symbol } = baseToken;
    const age = moment(pairCreatedAt).fromNow();
    const ageMinutes = Number(age.replace("minutes ago", ""));

    if (
      volume.h24 > VOLUME_THRESHOLD &&
      ageMinutes <= 10 &&
      !hypeNewPairs[address] &&
      ageMinutes <= AGE_THRESHOLD
    ) {
      const { marketCap, volume, liquidity, priceUsd, pairAddress } = pair;

      // Links
      const tokenLink = `https://solscan.io/token/${address}`;
      const dexScreenerLink = `https://dexscreener.com/solana/${pairAddress}`;
      const dexToolsLink = `https://www.dextools.io/app/en/solana/pair-explorer/${pairAddress}`;
      const rugCheckLink = `https://rugcheck.xyz/tokens/${address}`;
      const birdEyeLink = `https://birdeye.so/token/${address}?chain=solana`;

      // Metadata
      const metadata = await getTokenMetaData(address);
      if (!metadata) continue;

      const now = Math.floor(Date.now() / 1e3);
      hypeNewPairs[address] = now;
      pairsToTrack[pairAddress] = {
        startTime: now,
        initialPrice: Number(priceUsd),
        pastBenchmark: 1,
      };

      const socials = [];
      for (const [social, socialLink] of Object.entries(
        metadata.offChainMetadata?.metadata?.extensions || {}
      )) {
        socials.push(`[${toTitleCase(social)}](${socialLink})`);
      }
      const socialsText = socials.join(" \\| ") || "No links available";

      // Text
      const text = `${hardCleanUpBotMessage(name)} \\| [${hardCleanUpBotMessage(
        symbol
      )}](${tokenLink})
      
💰Market Cap $${cleanUpBotMessage(formatToInternational(marketCap))}
💲 Price: $${cleanUpBotMessage(formatToInternational(parseFloat(priceUsd)))}

📈 Volume: $${cleanUpBotMessage(formatToInternational(volume.h24))}
💰 Mcap: $${cleanUpBotMessage(formatToInternational(marketCap))}
💧 Liquidity: $${cleanUpBotMessage(formatToInternational(liquidity.usd))}
⌛ Token Created: ${age}

Token Contract: 
\`${address}\`

Security: [RugCheck](${rugCheckLink})
🫧 Socials: ${socialsText}

📊 [DexTools](${dexToolsLink}) 📊 [BirdEye](${birdEyeLink})
📊 [DexScreener](${dexScreenerLink}) 📊 [SolScan](${tokenLink})`;

      try {
        await teleBot.api.sendMessage(CHANNEL_ID, text, {
          parse_mode: "MarkdownV2",
          // @ts-expect-error Param not found
          disable_web_page_preview: true,
        });

        log(`Sent message for ${pairAddress} ${name}`);
      } catch (error) {
        errorHandler(error);
      }
    }
  }
}
