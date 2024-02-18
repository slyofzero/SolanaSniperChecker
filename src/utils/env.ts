import dotenv from "dotenv";
dotenv.config();

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  CHANNEL_ID,
  DATA_URL,
  PHOTON_COOKIE,
  RPC_ENDPOINT,
  FIREBASE_KEY,
  ENCRYPTION_KEY,
  BOT_INVITE_LINK,
} = process.env;
