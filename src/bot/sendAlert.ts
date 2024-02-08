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
import { PhotonPairData } from "@/types/livePairs";
import { trackMC } from "./trackMC";
import { PublicKey } from "@solana/web3.js";
import { solanaConnection } from "@/rpc";

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
    const ageMinutes =
      Number(age.replace("minutes ago", "")) ||
      Number(age.replace("a minutes ago", "1")) ||
      Number(age.replace("a few seconds ago", "1"));

    if (hypeNewPairs[tokenAddress]) {
      trackMC(pair);
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
        init_liq,
        audit,
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

      // Token Info
      const initliquidity = cleanUpBotMessage(
        formatToInternational(Number(init_liq.quote).toFixed(2))
      );
      const initliquidityUsd = cleanUpBotMessage(
        formatToInternational(Number(init_liq.usd).toFixed(2))
      );

      const liquidity = cleanUpBotMessage(
        formatToInternational(cur_liq.quote.toFixed(2))
      );
      const liquidityUsd = cleanUpBotMessage(
        formatToInternational(cur_liq.usd)
      );

      const totalSupply = (
        await solanaConnection.getTokenSupply(new PublicKey(tokenAddress))
      ).value.uiAmount;

      // Audit
      const { lp_burned_perc, mint_authority, top_holders_perc } = audit;
      const mintStatus = mint_authority ? "✅" : "❌";
      const mintText = mint_authority ? "Enabled" : "Disabled";
      const lpStatus = lp_burned_perc === 100 ? "✅" : "❌";
      const lpText =
        lp_burned_perc === 100
          ? "All LP Tokens burnt"
          : `Deployer owns ${(100 - lp_burned_perc).toFixed(0)}% of LP`;

      // Text
      const text = `${hardCleanUpBotMessage(name)} \\| [${hardCleanUpBotMessage(
        symbol
      )}](${tokenLink})
      
Supply: ${cleanUpBotMessage(formatToInternational(totalSupply || 0))}
📈 Volume: $${cleanUpBotMessage(formatToInternational(volume))}
💰 MCap: $${cleanUpBotMessage(formatToInternational(marketCap))}
💵 Intial Lp: ${initliquidity} SOL *\\($${initliquidityUsd}\\)*
🏦 Lp SOL: ${liquidity} SOL *\\($${liquidityUsd}\\)*
👥 Top 10 Holders: Owns ${cleanUpBotMessage(top_holders_perc.toFixed(2))}%

${mintStatus} Mint: ${mintText}
${lpStatus} LP status: ${lpText}

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
        log(text);
        errorHandler(error);
      }
    }
  }

  setIndexedTokens(newIndexedTokens);
}
