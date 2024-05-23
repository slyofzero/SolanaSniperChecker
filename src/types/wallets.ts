export interface StoredWallet {
  id?: string;
  userId: number;
  username: string;
  mnemonic: string;
  wallet: string;
  type: "CREATED" | "IMPORTED";
  verified: boolean;
}
