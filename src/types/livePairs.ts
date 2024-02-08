interface InitLiq {
  usd: string;
  quote: string;
  lp_amount: number;
  timestamp: number;
  open_timestamp: number;
}

interface CurLiq {
  quote: number;
  usd: string;
}

interface Audit {
  mint_authority: boolean;
  lp_burned_perc: number;
  top_holders_perc: number;
}

interface Socials {
  twitter: string | null;
  website: string | null;
  telegram: string | null;
  medium: string | null;
  reddit: string | null;
}

interface Attributes {
  volume: number;
  buys_count: number;
  sells_count: number;
  address: string;
  tokenAddress: string;
  fdv: number;
  name: string;
  symbol: string;
  created_timestamp: number;
  open_timestamp: number;
  init_liq: InitLiq;
  cur_liq: CurLiq;
  audit: Audit;
  socials: Socials;
}

export interface PhotonPairData {
  id: string;
  type: string;
  attributes: Attributes;
}

export interface PhotonPairs {
  data: PhotonPairData[];
}
