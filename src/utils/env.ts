import dotenv from "dotenv";
dotenv.config();

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  WSS_URL,
  CHANNEL_ID,
  HELIUS_API_KEY,
  TOKEN_DATA_URL,
} = process.env;
