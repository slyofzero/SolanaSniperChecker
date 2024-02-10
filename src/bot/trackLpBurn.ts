import { hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { teleBot } from "..";
import { hypeNewPairs } from "@/vars/tokens";
import { errorHandler, log } from "@/utils/handlers";
import { PhotonPairData } from "@/types/livePairs";
import { promoText } from "@/vars/promo";

export async function trackLpBurn(pair: PhotonPairData) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const { address, tokenAddress, symbol, audit } = pair.attributes;
  const { lp_burned_perc } = audit;
  const { lpStatus, launchMessage, ...rest } = hypeNewPairs[tokenAddress];
  const isLpStatusOkay = lp_burned_perc === 100;

  if (!lpStatus && isLpStatusOkay) {
    hypeNewPairs[tokenAddress] = {
      lpStatus: true,
      launchMessage,
      ...rest,
    };

    // Links
    const tokenLink = `https://solscan.io/token/${tokenAddress}`;
    const solanaTradingBotLink = `https://t.me/SolanaTradingBot?start=${tokenAddress}`;
    const bonkBotLink = `https://t.me/bonkbot_bot?start=${tokenAddress}`;
    const magnumLink = `https://t.me/magnum_trade_bot?start=${tokenAddress}`;
    const bananaLink = `https://t.me/BananaGunSolana_bot?start=${tokenAddress}`;
    const unibot = `https://t.me/solana_unibot?start=${tokenAddress}`;
    const dexScreenerLink = `https://dexscreener.com/solana/${address}`;
    const birdEyeLink = `https://birdeye.so/token/${tokenAddress}?chain=solana`;

    const text = `Powered By [Solana Hype Alerts](https://t.me/SolanaHypeTokenAlerts)
      
[${hardCleanUpBotMessage(symbol)}](${tokenLink}) LP tokens burnt 🔥🔥🔥 

Token Contract:
\`${tokenAddress}\`

Buy:
[SolTradeBot](${solanaTradingBotLink}) \\| [BonkBot](${bonkBotLink}) \\| [Magnum](${magnumLink})
[BananaGun](${bananaLink}) \\| [Unibot](${unibot})
[DexScreener](${dexScreenerLink}) \\| [BirdEye](${birdEyeLink})${promoText}`;

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
