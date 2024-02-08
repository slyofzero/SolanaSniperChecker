declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string | undefined;
      BOT_USERNAME: string | undefined;
      CHANNEL_ID: string | undefined;
      DATA_URL: string | undefined;
      PHOTON_COOKIE: string | undefined;
      RPC_ENDPOINT: string | undefined;
    }
  }
}

export {};
