import { getDocument, updateDocumentById } from "@/firebase";
import { solanaConnection } from "@/rpc";
import { StoredAccount } from "@/types/accounts";
import { decrypt } from "@/utils/cryptography";
import { errorHandler, log } from "@/utils/handlers";
import { Keypair } from "@solana/web3.js";

export async function unlockUnusedAccounts() {
  const lockedAccounts = (await getDocument({
    collectionName: "accounts",
    queries: [["locked", "==", true]],
  })) as StoredAccount[];

  log("Unlocking accounts");

  for (const { id, secretKey } of lockedAccounts) {
    try {
      const account = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(decrypt(secretKey)))
      );
      const balance = await solanaConnection.getBalance(account.publicKey);
      log(`Account balance - ${balance}`);

      if (balance === 0) {
        updateDocumentById({
          updates: { locked: false, lockedAt: null },
          collectionName: "accounts",
          id: id || "",
        }).then(() => log(`Unlocked account ${id}`));
      }
    } catch (error) {
      errorHandler(error);
    }
  }
}
