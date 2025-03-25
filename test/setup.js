import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const TEST_WALLET = Keypair.generate();
export const TEST_CONFIG = {
  totalSupply: 4,
  batchSize: 2,
  numberOfBatches: 2,
  mintingDelay: 1000,
  recordsFile: './test/fixtures/test-minting-records.json'
};

export function createTestWallet() {
  return {
    publicKey: TEST_WALLET.publicKey.toBase58(),
    privateKey: bs58.encode(TEST_WALLET.secretKey)
  };
} 