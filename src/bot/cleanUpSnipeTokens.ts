import { MAX_START_TIME } from "@/utils/constants";
import { log } from "@/utils/handlers";
import { hypeNewPairs } from "@/vars/tokens";

export function cleanUpSnipeTokens() {
  const now = Math.floor(Date.now() / 1e3);
  const tokensToRemove = [];
  log("Cleanup initiated");

  for (const token in hypeNewPairs) {
    const startTime = hypeNewPairs[token];
    const timeDiff = now - startTime;

    if (timeDiff > MAX_START_TIME) {
      tokensToRemove.push(token);
    }
  }

  for (const token of tokensToRemove) {
    delete hypeNewPairs[token];
    log(`Removed ${token}`);
  }
}
