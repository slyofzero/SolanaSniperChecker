import { HELIUS_API_KEY } from "./env";

export const VOLUME_THRESHOLD = 3500;
export const CHECK_INTERVAL = 5 * 60;
export const CLEANUP_INTERVAL = 30;
export const MAX_START_TIME = 60 * 10;
export const AGE_THRESHOLD = 10;
export const heliusUrl = `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`;
