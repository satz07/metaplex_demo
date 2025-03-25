import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main Configuration Object
 * Defines all the parameters for the NFT minting process
 */

const CONFIG = {
  totalSupply: 10,          // Total number of NFTs that can be minted
  batchSize: 2,             // Number of NFTs in each batch
  numberOfBatches: 5,       // Total number of batches
  mintingDelay: 2000,       // Delay between individual mints (in milliseconds)
  recordsFile: './minting-records.json',  // File to store minting records
  nftConfig: {
    name: "My NFT Collection",
    symbol: "MNFT",
    sellerFeeBasisPoints: 500,  // 5% royalty fee
    isMutable: true,            // NFT metadata can be updated later
    baseUri: "https://rv7ujzn3s4nolx3gabyfpg4lknggg5qqv6be323idut1aqkrzfxa.arweave.net/jX9E5buXGuXfZgBMJuIU"
  }
};

// Wallet initialization using environment variable
// WARNING: Never commit private keys to source control
console.log(process.env.PRIVATE_KEY_BASE58)
const PRIVATE_KEY_BASE58 = process.env.PRIVATE_KEY_BASE58
if (!PRIVATE_KEY_BASE58) {
  throw new Error("Private key not found in environment variables!");
}

const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
console.log("Using Wallet Address:", wallet.publicKey.toBase58());

// Initialize Solana connection with devnet
const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60000  // 60 second timeout
});

// Initialize Metaplex instance
const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

/**
 * Loads the minting records from the JSON file
 * Creates default structure if file doesn't exist
 * @returns {Promise<Object>} The minting records
 */
async function loadMintingRecords() {
  try {
    const data = await fs.readFile(CONFIG.recordsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      mintedCount: 0,
      mintedNFTs: [],
      lastBatchMinted: 0,
      lastMintTimestamp: null
    };
  }
}

/**
 * Saves the minting records to the JSON file
 * @param {Object} records - The records to save
 */
async function saveMintingRecords(records) {
  await fs.writeFile(CONFIG.recordsFile, JSON.stringify(records, null, 2));
}

/**
 * Utility function to pause execution
 * @param {number} ms - Milliseconds to sleep
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mints a single NFT
 * @param {number} index - The index of the NFT in the collection
 * @param {Object} records - The current minting records
 * @returns {Promise<boolean>} Success status of the mint
 */
async function mintSingleNFT(index, records) {
  try {
    console.log(`Minting NFT #${index + 1}...`);
    
    const { nft } = await metaplex.nfts().create({
      uri: CONFIG.nftConfig.baseUri,
      name: `${CONFIG.nftConfig.name} #${index + 1}`,
      symbol: CONFIG.nftConfig.symbol,
      sellerFeeBasisPoints: CONFIG.nftConfig.sellerFeeBasisPoints,
      isMutable: CONFIG.nftConfig.isMutable,
      maxSupply: 1,
      mintAuthority: wallet,
      updateAuthority: wallet,
    });

    console.log(`NFT #${index + 1} Minted Successfully!`);
    console.log("NFT Address:", nft.address.toBase58());
    
    records.mintedNFTs.push({
      number: index + 1,
      address: nft.address.toBase58(),
      name: `${CONFIG.nftConfig.name} #${index + 1}`,
      mintedAt: new Date().toISOString(),
      batchNumber: Math.floor(index / CONFIG.batchSize) + 1
    });
    
    records.mintedCount++;
    await saveMintingRecords(records);
    return true;
  } catch (error) {
    console.error(`Error Minting NFT #${index + 1}:`, error.message);
    return false;
  }
}

/**
 * Mints a batch of NFTs
 * @param {number} batchNumber - The batch number to mint
 */
async function mintBatch(batchNumber) {
  const records = await loadMintingRecords();
  
  // Check if batch was already minted
  if (records.mintedNFTs.some(nft => nft.batchNumber === batchNumber)) {
    console.error(`Batch ${batchNumber} has already been minted!`);
    return;
  }

  // Check if we're trying to mint batches in order
  if (batchNumber > records.lastBatchMinted + 1) {
    console.error(`Please mint batch ${records.lastBatchMinted + 1} first!`);
    return;
  }

  const startIndex = (batchNumber - 1) * CONFIG.batchSize;
  const size = Math.min(CONFIG.batchSize, CONFIG.totalSupply - startIndex);

  if (size <= 0) {
    console.error("No more NFTs to mint in this batch!");
    return;
  }

  console.log(`\nStarting Batch ${batchNumber} (${size} NFTs)`);
  console.log("Wallet Address:", wallet.publicKey.toBase58());
  
  for (let i = 0; i < size; i++) {
    const globalIndex = startIndex + i;
    if (globalIndex >= CONFIG.totalSupply) break;
    
    await mintSingleNFT(globalIndex, records);
    if (i < size - 1) await sleep(CONFIG.mintingDelay);
  }
  
  records.lastBatchMinted = batchNumber;
  records.lastMintTimestamp = new Date().toISOString();
  await saveMintingRecords(records);
  
  console.log(`\nBatch ${batchNumber} Complete!`);
  console.log(`Total NFTs Minted: ${records.mintedCount}`);
}

/**
 * Displays the current minting status
 * Shows total supply, minted count, and details of minted NFTs
 */
async function showMintingStatus() {
  const records = await loadMintingRecords();
  console.log("\nMinting Status:");
  console.log("--------------");
  console.log(`Total Supply: ${CONFIG.totalSupply}`);
  console.log(`NFTs Minted: ${records.mintedCount}`);
  console.log(`Last Batch Minted: ${records.lastBatchMinted}`);
  console.log(`Last Mint Time: ${records.lastMintTimestamp || 'Never'}`);
  
  if (records.mintedNFTs.length > 0) {
    console.log("\nMinted NFTs:");
    console.table(records.mintedNFTs);
  }
}

// CLI command handling
const command = process.argv[2];
const batchNumber = parseInt(process.argv[3]);

if (!command) {
  console.log("\nUsage:");
  console.log("node nft.js status              - Show minting status");
  console.log("node nft.js mint <batch_number> - Mint specific batch");
} else if (command === "status") {
  showMintingStatus();
} else if (command === "mint" && !isNaN(batchNumber)) {
  mintBatch(batchNumber);
} else {
  console.error("Invalid command or batch number!");
}