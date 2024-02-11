interface Token {
  address: string;
  name: string;
  symbol: string;
}

interface Transactions {
  buys: number;
  sells: number;
}

interface PriceChange {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

interface Volume {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

interface Liquidity {
  usd: number;
  base: number;
  quote: number;
}

interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: Token;
  quoteToken: Token;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: Transactions;
    h1: Transactions;
    h6: Transactions;
    h24: Transactions;
  };
  volume: Volume;
  priceChange: PriceChange;
  liquidity: Liquidity;
  fdv: number;
  pairCreatedAt: number;
}

export interface PairDataResponse {
  schemaVersion: string;
  pairs: PairData[];
}
