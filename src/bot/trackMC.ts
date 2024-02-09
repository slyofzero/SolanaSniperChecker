import { cleanUpBotMessage, hardCleanUpBotMessage } from "@/utils/bot";
import { CHANNEL_ID } from "@/utils/env";
import { teleBot } from "..";
import { log } from "console";
import { hypeNewPairs } from "@/vars/tokens";
import { errorHandler } from "@/utils/handlers";
import { formatToInternational } from "@/utils/general";
import { PhotonPairData } from "@/types/livePairs";

export async function trackMC(pair: PhotonPairData) {
  if (!CHANNEL_ID) {
    log("CHANNEL_ID is undefined");
    process.exit(1);
  }

  const { fdv: marketCap, address, tokenAddress, symbol } = pair.attributes;
  const { initialMC, pastBenchmark, startTime } = hypeNewPairs[tokenAddress];
  const currentMC = Number(marketCap);

  if (initialMC === 0 && currentMC > 0) {
    log(`Token ${tokenAddress} got a non-zero price`);
    hypeNewPairs[tokenAddress] = {
      initialMC: currentMC,
      startTime,
      pastBenchmark: 1,
    };
  } else {
    const exactIncrease = Number((currentMC / initialMC).toFixed(2));
    const increase = Math.floor(exactIncrease);

    if (increase > 1 && increase > pastBenchmark) {
      log(`Token ${tokenAddress} increased by ${increase}x`);
      hypeNewPairs[tokenAddress] = {
        initialMC,
        startTime,
        pastBenchmark: increase,
      };

      // Links
      const tokenLink = `https://solscan.io/token/${tokenAddress}`;
      const solanaTradingBotLink = `https://t.me/SolanaTradingBot?start=${tokenAddress}`;
      const bonkBotLink = `https://t.me/bonkbot_bot?start=${tokenAddress}`;
      const magnumLink = `https://t.me/magnum_trade_bot?start=${tokenAddress}`;
      const bananaLink = `https://t.me/BananaGunSolana_bot?start=${tokenAddress}`;
      const unibot = `https://t.me/solana_unibot?start=${tokenAddress}`;

      const text = `Powered By [Solana Hype Alerts](https://t.me/SolanaHypeTokenAlerts)

[${hardCleanUpBotMessage(symbol)}](${tokenLink}) jumped by ${cleanUpBotMessage(
        exactIncrease
      )}x\\!\\!\\!
      
💲 MC when found: $${cleanUpBotMessage(formatToInternational(initialMC))}
💲 MC now: $${cleanUpBotMessage(formatToInternational(currentMC))}

Token Contract:
\`${tokenAddress}\`

Buy:
[SolTradeBot](${solanaTradingBotLink}) \\| [BonkBot](${bonkBotLink}) \\| [Magnum](${magnumLink})
[BananaGun](${bananaLink}) \\| [Unibot](${unibot})`;

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
