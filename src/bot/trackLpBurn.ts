import { log } from "@/utils/handlers";
import { indexedTokens, previouslyIndexedTokens } from "@/vars/tokens";

export function trackLpBurn() {
  log("Checking LP burn");
  for (const token of previouslyIndexedTokens) {
    const isBurnt = !indexedTokens.includes(token);

    if (isBurnt) {
      console.log(`Token ${token} LP burnt`);
    }
  }
}
