import { log } from "@/utils/handlers";
import { hypeNewPairs } from "@/vars/tokens";

export function cleanUpHypePairs() {
  const now = Math.floor(Date.now() / 1e3);
  const tokensToRemove = [];
  log("Cleanup initiated");

  for (const token in hypeNewPairs) {
    const { startTime } = hypeNewPairs[token];
    const timeDiff = now - startTime;

    if (timeDiff > 24 * 3600) {
      // 3 hours in seconds
      tokensToRemove.push(token);
    }
  }

  for (const token of tokensToRemove) {
    delete hypeNewPairs[token];
    log(`Removed ${token}`);
  }
}
