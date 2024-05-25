import {
  AGE_THRESHOLD,
  LIQUIDITY_THRESHOLD,
  VOLUME_THRESHOLD,
} from "@/utils/constants";
import {
  formatToInternational,
  getRandomInteger,
  toTitleCase,
} from "@/utils/general";
import { hypeNewPairs, setIndexedTokens } from "@/vars/tokens";
import { teleBot } from "..";
import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { errorHandler, log } from "@/utils/handlers";
import moment from "moment";
import { PhotonPairData } from "@/types/livePairs";
import { PublicKey } from "@solana/web3.js";
import { solanaConnection } from "@/rpc";
import { trackLpBurn } from "./trackLpBurn";
import { promoText } from "@/vars/promo";

export async function sendAlert(pairs: PhotonPairData[]) {
  try {
    if (!CHANNEL_ID) {
      log("CHANNEL_ID is undefined");
      process.exit(1);
    }

    const newIndexedTokens = [];
    log(`Got ${pairs.length} pairs`);

    for (const pair of pairs) {
      const {
        volume,
        created_timestamp,
        tokenAddress,
        cur_liq,
        init_liq,
        fdv: marketCap,
      } = pair.attributes;

      newIndexedTokens.push(tokenAddress);
      const age = moment(created_timestamp * 1e3).fromNow();
      const ageMinutes =
        Number(age.replace("minutes ago", "")) ||
        Number(age.replace("a minutes ago", "1")) ||
        Number(age.replace("a few seconds ago", "1"));

      if (hypeNewPairs[tokenAddress]) {
        trackLpBurn(pair);
      } else if (
        volume >= VOLUME_THRESHOLD &&
        ageMinutes <= AGE_THRESHOLD &&
        parseFloat(init_liq.quote) >= LIQUIDITY_THRESHOLD &&
        parseFloat(init_liq.quote) <= 50 &&
        marketCap > 0 &&
        cur_liq.quote > parseFloat(init_liq.quote)
      ) {
        const {
          address,
          socials: storedSocials,
          symbol,
          name,
          init_liq,
          audit,
        } = pair.attributes;

        const token = new PublicKey(tokenAddress);
        const addresses = await solanaConnection.getTokenLargestAccounts(token);
        const totalSupply = (
          await solanaConnection.getTokenSupply(new PublicKey(tokenAddress))
        ).value.uiAmount;

        const balances = addresses.value.slice(0, 10);
        let top2Hold = 0;
        let top10Hold = 0;
        const balancesText = balances
          .map((balance, index) => {
            const address = balance?.address.toString();

            if (balance.uiAmount && totalSupply) {
              const held = ((balance.uiAmount / totalSupply) * 100).toFixed(2);
              if (index < 2) top2Hold += parseFloat(held);
              top10Hold += parseFloat(held);
              const percHeld = cleanUpBotMessage(held);
              return `[${percHeld}%](https://solscan.io/account/${address})`;
            }
          })
          .slice(0, 5)
          .join(" \\| ");

        if (top2Hold >= 70) continue;

        // Links
        const tokenLink = `https://solscan.io/token/${tokenAddress}`;
        // const pairLink = `https://solscan.io/account/${address}`;
        const dexScreenerLink = `https://dexscreener.com/solana/${address}`;
        const rugCheckLink = `https://rugcheck.xyz/tokens/${tokenAddress}`;
        const solanaTradingBotLink = `https://t.me/SolTradingBot?start=${tokenAddress}`;
        const bonkBotLink = `https://t.me/bonkbot_bot?start=${tokenAddress}`;
        const magnumLink = `https://t.me/magnum_trade_bot?start=${tokenAddress}`;
        const bananaLink = `https://t.me/BananaGunSolana_bot?start=${tokenAddress}`;
        const unibot = `https://t.me/solana_unibot?start=r-reelchasin-${tokenAddress}`;
        const photonLink = `https://photon-sol.tinyastro.io/en/r/@solhypealerts/${tokenAddress}`;

        const now = Math.floor(Date.now() / 1e3);

        const socials = [];
        for (const [social, socialLink] of Object.entries(
          storedSocials || {}
        )) {
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
        const hypeScore = getRandomInteger();

        // Audit
        const { lp_burned_perc, mint_authority } = audit;
        const mintStatus = !mint_authority ? "🟥" : "🟩";
        const mintText = !mint_authority ? "Enabled" : "Disabled";
        const isLpStatusOkay = lp_burned_perc === 100;
        const lpStatus = isLpStatusOkay ? "🟩" : "⚠️";
        const issues = Number(!isLpStatusOkay) + Number(!mint_authority);
        const issuesText = issues === 1 ? `1 issue` : `${issues} issues`;
        const score =
          isLpStatusOkay && mint_authority
            ? `Good \\(${issuesText}\\) 🟢🟢🟢`
            : issues === 1
            ? `Bad \\(${issuesText}\\) 🟡🟡🟡`
            : `Bad \\(${issuesText}\\) 🔴🔴🔴`;

        const lpText = isLpStatusOkay
          ? "All LP Tokens burnt"
          : `Deployer owns ${(100 - lp_burned_perc).toFixed(0)}% of LP`;

        // Text
        const text = `Powered By [TOOLS AI FOMO ALERT GAINS \\(SOL\\)](https://t.me/ToolsAiFomoAlerts_Solana) \\| Hype Alert
      
${hardCleanUpBotMessage(name)} \\| [${hardCleanUpBotMessage(
          symbol
        )}](${tokenLink})

*Hype: ${hypeScore}/100*
      
Supply: ${cleanUpBotMessage(formatToInternational(totalSupply || 0))}
💰 MCap: $${cleanUpBotMessage(formatToInternational(marketCap))}
💵 Intial Lp: ${initliquidity} SOL *\\($${initliquidityUsd}\\)*
🏦 Lp SOL: ${liquidity} SOL *\\($${liquidityUsd}\\)*
👥 Top 10 Holders: Owns ${cleanUpBotMessage(top10Hold.toFixed(2))}%
👥 Top Holders:
${balancesText}

🧠 Score: ${score}
${mintStatus} Mint: ${mintText}
${lpStatus} LP status: ${lpText}

Token Contract: 
\`${tokenAddress}\`

Security: [RugCheck](${rugCheckLink})
🫧 Socials: ${socialsText}

📊 [Photon](${photonLink}) \\| 📊 [DexScreener](${dexScreenerLink})

Buy:
[Photon](${photonLink}) \\| [SolTradeBot](${solanaTradingBotLink}) \\| [BonkBot](${bonkBotLink})
[Magnum](${magnumLink}) \\| [BananaGun](${bananaLink}) \\| [Unibot](${unibot})

Powered By [TOOLS AI FOMO ALERT GAINS \\(SOL\\)](https://t.me/ToolsAiFomoAlerts_Solana)${promoText}`;

        try {
          const message = await teleBot.api.sendMessage(CHANNEL_ID, text, {
            parse_mode: "MarkdownV2",
            // @ts-expect-error Param not found
            disable_web_page_preview: true,
          });

          hypeNewPairs[tokenAddress] = {
            startTime: now,
            initialMC: marketCap,
            pastBenchmark: 1,
            launchMessage: message.message_id,
            lpStatus: isLpStatusOkay,
          };

          log(`Sent message for ${address} ${name}`);
        } catch (error) {
          log(text);
          errorHandler(error);
        }
      }
    }

    setIndexedTokens(newIndexedTokens);
  } catch (error) {
    errorHandler(error);
  }
}
