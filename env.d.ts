declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string | undefined;
      BOT_USERNAME: string | undefined;
      CHANNEL_ID: string | undefined;
      PUBLIC_CHANNEL_ID: string | undefined;
      DATA_URL: string | undefined;
      PHOTON_COOKIE: string | undefined;
      RPC_ENDPOINT: string | undefined;
      FIREBASE_KEY: string | undefined;
      ENCRYPTION_KEY: string | undefined;
      BOT_INVITE_LINK: string | undefined;
    }
  }
}

export {};
