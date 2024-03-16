import { solanaConnection } from "@/rpc";
import web3, { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import { errorHandler, log } from "./handlers";
import { splitPaymentsWith } from "./constants";

export function generateAccount() {
  const randomBytes = ethers.utils.randomBytes(32);
  const mnemonic = ethers.utils.entropyToMnemonic(randomBytes);
  const seed = ethers.utils.mnemonicToSeed(mnemonic);
  const hex = Uint8Array.from(Buffer.from(seed));
  const keyPair = nacl.sign.keyPair.fromSeed(hex.slice(0, 32));
  const { publicKey, secretKey } = new web3.Keypair(keyPair);
  const data = {
    publicKey: publicKey.toString(),
    secretKey: `[${secretKey.toString()}]`,
  };
  return data;
}

export async function sendTransaction(
  secretKey: string,
  amount: number,
  to?: string
) {
  try {
    if (!to) {
      return false;
    }

    const secretKeyArray = new Uint8Array(JSON.parse(secretKey));
    const account = web3.Keypair.fromSecretKey(secretKeyArray);
    const toPubkey = new PublicKey(to);

    const { lamportsPerSignature } = (
      await solanaConnection.getRecentBlockhash("confirmed")
    ).feeCalculator;

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey,
        lamports: amount - lamportsPerSignature,
      })
    );

    const signature = await web3.sendAndConfirmTransaction(
      solanaConnection,
      transaction,
      [account]
    );
    return signature;
  } catch (error) {
    log(`No transaction for ${amount} to ${to}`);
    errorHandler(error);
  }
}

export async function splitPayment(
  secretKey: string,
  totalPaymentAmount: number
) {
  const { dev, me, neo } = splitPaymentsWith;

  const myShare = Math.floor(me.share * totalPaymentAmount);
  const devShare = Math.floor(dev.share * totalPaymentAmount);
  const neoShare = totalPaymentAmount - (devShare + myShare);

  sendTransaction(secretKey, myShare, me.address).then(() =>
    log(`Fees of ${myShare} lamports sent to account ${me.address}`)
  );

  sendTransaction(secretKey, devShare, dev.address).then(() =>
    log(`Fees of ${devShare} lamports sent to account ${dev.address}`)
  );

  sendTransaction(secretKey, neoShare, neo.address).then(() =>
    log(`Fees of ${neoShare} lamports sent to account ${neo.address}`)
  );
}
