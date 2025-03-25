# NFT Minting & Marketplace on Solana Blockchain

NFT Minting & Marketplace for Fragrance Industry in Solana Blockchain using Metaplex library.

## Features

- Batch minting of NFTs with configurable sizes
- Persistent progress tracking in JSON format
- Sequential batch enforcement to prevent gaps
- Detailed minting records with timestamps
- Configurable delays between mints
- Command-line interface for easy interaction

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Solana CLI tools (recommended for wallet management)
- A Solana wallet with sufficient SOL for minting

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nft-batch-minting
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate your Solana wallet:
   ```bash
   # Create generate-key.js if not exists
   node generate-key.js
   ```
   This will output something like:
   ```bash
   Public Key: AbC123...XyZ
   Private Key (save to .env): WJt99t5z...E17i
   ```

4. Create `.env` file and add your private key:
   ```bash
   # Create .env file
   touch .env

   # Add your private key to .env
   echo "PRIVATE_KEY_BASE58=your-private-key-here" >> .env
   ```

   Example `.env` file:
   ```env
   # Solana wallet private key (base58 encoded)
   PRIVATE_KEY_BASE58=your-private-key-here
   ```

5. Fund your wallet with devnet SOL:
   ```bash
   solana airdrop 2 YOUR_PUBLIC_KEY --url devnet
   ```

## Configuration

The tool uses a configuration object in `nft.js`:

```bash
javascript
const CONFIG = {
totalSupply: 10, // Total NFTs in collection
batchSize: 2, // NFTs per batch
numberOfBatches: 5, // Total number of batches
mintingDelay: 2000, // Delay between mints (ms)
recordsFile: './minting-records.json',
nftConfig: {
name: "My NFT Collection",
symbol: "MNFT",
sellerFeeBasisPoints: 500, // 5% royalty fee
isMutable: true
}
}
````


## Usage

### Check Minting Status
View current minting progress and NFT details:

```bash
node nft.js status
```

### Mint NFTs
Mint a specific batch of NFTs:

```bash
node nft.js mint <batch_number>
```

Example:
```bash
Mint batch 1
node nft.js mint 1
Mint batch 2
node nft.js mint 2
```


## Minting Records

The tool maintains a record of all minted NFTs in `minting-records.json`:

```bash
json
{
"mintedCount": 2,
"mintedNFTs": [
{
"number": 1,
"address": "AhfPqbPs7cLT2yzSEBHS117VzPGL6D1k2pRq6TyVcNB1",
"name": "My NFT Collection #1",
"mintedAt": "2025-03-20T18:56:53.959Z",
"batchNumber": 1
}
],
"lastBatchMinted": 1,
"lastMintTimestamp": "2025-03-20T18:56:53.959Z"
}
```


## Security Considerations

### Private Keys
- Never commit private keys to source control
- Use environment variables for sensitive data
- Keep your wallet secure

### Network Selection
- Default network is Solana devnet
- Test thoroughly before mainnet deployment

### Rate Limiting
- Default delay is 2 seconds between mints
- Adjust `mintingDelay` if needed

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance

bash
Transaction simulation failed: Attempt to debit an account but found no record of a prior credit

**Solution:**
- Ensure wallet has enough SOL
- Use `solana airdrop` on devnet:
  ```bash
  solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
  ```

#### 2. Transaction Timeout

bash
Transaction was not confirmed in 60.00 seconds

**Solution:**
- Check network status
- Increase timeout in connection settings
- Verify RPC endpoint connectivity

#### 3. Rate Limiting
**Solution:**
- Increase `mintingDelay` in CONFIG
- Reduce batch size
- Use a different RPC endpoint

## Best Practices

1. Always check status before minting:
   ```bash
   node nft.js status
   ```
2. Mint batches sequentially
3. Monitor wallet balance regularly
4. Back up minting records
5. Test with small batches first

## Error Handling

The tool includes error handling for:
- Network connectivity issues
- Transaction failures and timeouts
- Rate limiting and RPC errors
- Invalid batch numbers
- Duplicate minting attempts
- Insufficient funds

## File Structure

```bash
.
├── nft.js # Main minting script
├── package.json # Project dependencies
├── minting-records.json # Minting progress tracker
└── .gitignore # Git ignore patterns
```


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

---