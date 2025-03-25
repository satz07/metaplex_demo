import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from 'fs/promises';

// let keypair = Keypair.generate()
// let base58PrivateKey = bs58.encode(keypair.secretKey)

// Configuration object
const CONFIG = {
  totalSupply: 10,
  batchSize: 2,
  numberOfBatches: 5,
  mintingDelay: 2000, // Delay between mints in milliseconds
  recordsFile: './minting-records.json',
  nftConfig: {
    name: "My NFT Collection",
    symbol: "MNFT",
    sellerFeeBasisPoints: 500, // 5%
    isMutable: true,
    // You can store your metadata URIs in an array if they're different for each NFT
    baseUri: "https://rv7ujzn3s4nolx3gabyfpg4lknggg5qqv6be323idut1aqkrzfxa.arweave.net/jX9E5buXGuXfZgBMJuIU"
  }
};

// Initialize wallet and connection
const PRIVATE_KEY_BASE58 = "WJt99t5zTbXDrPwZQb5SJHgtAutWBQpUXuEoMrvQ6StDaNCNcVU1R82AAFrSZrjsRD4af9eztyaHQqfyRDSE17i";
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
console.log("Using Wallet Address:", wallet.publicKey.toBase58());

const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60000
});
const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

// Minting records management
async function loadMintingRecords() {
  try {
    const data = await fs.readFile(CONFIG.recordsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      mintedCount: 0,
      mintedNFTs: [],
      lastBatchMinted: -1,
      lastMintTimestamp: null
    };
  }
}

async function saveMintingRecords(records) {
  await fs.writeFile(CONFIG.recordsFile, JSON.stringify(records, null, 2));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Command line interface
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