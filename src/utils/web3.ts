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
  let attempts = 0;

  try {
    if (!to) {
      return false;
    }

    attempts += 1;

    const { lamportsPerSignature } = (
      await solanaConnection.getRecentBlockhash("confirmed")
    ).feeCalculator;

    const secretKeyArray = new Uint8Array(JSON.parse(secretKey));
    const account = web3.Keypair.fromSecretKey(secretKeyArray);
    const toPubkey = new PublicKey(to);

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

    if (attempts < 1) {
      sendTransaction(secretKey, amount, to);
    }
  }
}

export async function splitPayment(
  secretKey: string,
  totalPaymentAmount: number
) {
  for (const revShare in splitPaymentsWith) {
    const { address, share } = splitPaymentsWith[revShare];
    const amountToShare = totalPaymentAmount * share;

    sendTransaction(secretKey, amountToShare, address).then((sig) =>
      log(`Fees of ${amountToShare} lamports sent to account ${sig}`)
    );
  }
}
