import {
  AGE_THRESHOLD,
  LIQUIDITY_THRESHOLD,
  VOLUME_THRESHOLD,
} from "@/utils/constants";
import { formatToInternational, toTitleCase } from "@/utils/general";
import { hypeNewPairs, setIndexedTokens } from "@/vars/tokens";
import { teleBot } from "..";
import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { errorHandler, log } from "@/utils/handlers";
import moment from "moment";
// import { trackMC } from "./trackMC";
import { PhotonPairData } from "@/types/livePairs";

export async function sendAlert(pairs: PhotonPairData[]) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const newIndexedTokens = [];

  for (const pair of pairs) {
    const { volume, created_timestamp, tokenAddress, cur_liq } =
      pair.attributes;

    newIndexedTokens.push(tokenAddress);
    const age = moment(created_timestamp * 1e3).fromNow();
    const ageMinutes = Number(age.replace("minutes ago", ""));

    if (hypeNewPairs[tokenAddress]) {
      // trackMC(pair);
    } else if (
      volume >= VOLUME_THRESHOLD &&
      ageMinutes <= AGE_THRESHOLD &&
      parseFloat(cur_liq.usd) >= LIQUIDITY_THRESHOLD
    ) {
      const {
        fdv: marketCap,
        address,
        socials: storedSocials,
        symbol,
        name,
      } = pair.attributes;

      // Links
      const tokenLink = `https://solscan.io/token/${tokenAddress}`;
      const pairLink = `https://solscan.io/account/${address}`;
      const dexScreenerLink = `https://dexscreener.com/solana/${address}`;
      const dexToolsLink = `https://www.dextools.io/app/en/solana/pair-explorer/${address}`;
      const rugCheckLink = `https://rugcheck.xyz/tokens/${tokenAddress}`;
      const birdEyeLink = `https://birdeye.so/token/${tokenAddress}?chain=solana`;

      const now = Math.floor(Date.now() / 1e3);
      hypeNewPairs[tokenAddress] = {
        startTime: now,
        initialMC: marketCap,
        pastBenchmark: 1,
      };

      const socials = [];
      for (const [social, socialLink] of Object.entries(storedSocials || {})) {
        if (socialLink) {
          socials.push(`[${toTitleCase(social)}](${socialLink})`);
        }
      }
      const socialsText = socials.join(" \\| ") || "No links available";

      // Text
      const text = `${hardCleanUpBotMessage(name)} \\| [${hardCleanUpBotMessage(
        symbol
      )}](${tokenLink})
      
💰Market Cap $${cleanUpBotMessage(formatToInternational(marketCap))}
📈 Volume: $${cleanUpBotMessage(formatToInternational(volume))}
💰 Mcap: $${cleanUpBotMessage(formatToInternational(marketCap))}
💧 Liquidity: $${cleanUpBotMessage(cur_liq.usd)}
⌛ Token Created: ${age}

Token Contract: 
\`${tokenAddress}\`

Security: [RugCheck](${rugCheckLink})
🫧 Socials: ${socialsText}

📊 [DexTools](${dexToolsLink}) 📊 [BirdEye](${birdEyeLink})
📊 [DexScreener](${dexScreenerLink}) 📊 [SolScan](${pairLink})`;

      try {
        await teleBot.api.sendMessage(CHANNEL_ID, text, {
          parse_mode: "MarkdownV2",
          // @ts-expect-error Param not found
          disable_web_page_preview: true,
        });

        log(`Sent message for ${address} ${name}`);
      } catch (error) {
        errorHandler(error);
      }
    }
  }

  setIndexedTokens(newIndexedTokens);
}
