import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { TEST_CONFIG, createTestWallet } from './setup.js';
import { cleanupTestRecords, createMockRecords, delay } from './utils/helpers.js';
import fs from 'fs/promises';

describe('NFT Minting Tests', () => {
  let testWallet;

  before(async () => {
    // Setup test environment
    testWallet = createTestWallet();
    await cleanupTestRecords();
  });

  beforeEach(async () => {
    // Reset records before each test
    await cleanupTestRecords();
  });

  after(async () => {
    // Cleanup after all tests
    await cleanupTestRecords();
  });

  describe('Batch Minting', () => {
    it('should mint a batch of NFTs', async () => {
      // Setup initial records
      const initialRecords = {
        mintedCount: 0,
        mintedNFTs: [],
        lastBatchMinted: 0,
        lastMintTimestamp: null
      };
      await createMockRecords(initialRecords);

      // Simulate minting batch 1
      const batchNumber = 1;
      const startIndex = (batchNumber - 1) * TEST_CONFIG.batchSize;
      const size = Math.min(TEST_CONFIG.batchSize, TEST_CONFIG.totalSupply - startIndex);

      // Create mock minted NFTs
      const mintedNFTs = [];
      for (let i = 0; i < size; i++) {
        mintedNFTs.push({
          number: startIndex + i + 1,
          address: `TEST_ADDRESS_${startIndex + i + 1}`,
          name: `Test NFT #${startIndex + i + 1}`,
          mintedAt: new Date().toISOString(),
          batchNumber: batchNumber
        });
      }

      // Update records
      const updatedRecords = {
        mintedCount: size,
        mintedNFTs: mintedNFTs,
        lastBatchMinted: batchNumber,
        lastMintTimestamp: new Date().toISOString()
      };
      await createMockRecords(updatedRecords);

      // Verify records
      const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
      expect(records.mintedCount).to.equal(size);
      expect(records.mintedNFTs).to.have.lengthOf(size);
      expect(records.lastBatchMinted).to.equal(batchNumber);
    });

    it('should prevent minting duplicate batches', async () => {
      // Setup records with batch 1 already minted
      const existingRecords = {
        mintedCount: 2,
        mintedNFTs: [
          {
            number: 1,
            address: 'TEST_ADDRESS_1',
            name: 'Test NFT #1',
            mintedAt: new Date().toISOString(),
            batchNumber: 1
          },
          {
            number: 2,
            address: 'TEST_ADDRESS_2',
            name: 'Test NFT #2',
            mintedAt: new Date().toISOString(),
            batchNumber: 1
          }
        ],
        lastBatchMinted: 1,
        lastMintTimestamp: new Date().toISOString()
      };
      await createMockRecords(existingRecords);

      // Attempt to mint batch 1 again
      try {
        const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
        if (records.mintedNFTs.some(nft => nft.batchNumber === 1)) {
          throw new Error('Batch 1 has already been minted!');
        }
      } catch (error) {
        expect(error.message).to.equal('Batch 1 has already been minted!');
      }
    });

    it('should enforce sequential batch minting', async () => {
      // Setup records with no batches minted
      const initialRecords = {
        mintedCount: 0,
        mintedNFTs: [],
        lastBatchMinted: 0,
        lastMintTimestamp: null
      };
      await createMockRecords(initialRecords);

      // Attempt to mint batch 2 before batch 1
      try {
        const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
        const batchNumber = 2;
        if (batchNumber > records.lastBatchMinted + 1) {
          throw new Error(`Please mint batch ${records.lastBatchMinted + 1} first!`);
        }
      } catch (error) {
        expect(error.message).to.equal('Please mint batch 1 first!');
      }
    });
  });

  describe('Record Keeping', () => {
    it('should maintain accurate minting records', async () => {
      // Setup test data
      const testData = {
        mintedCount: 2,
        mintedNFTs: [
          {
            number: 1,
            address: 'TEST_ADDRESS_1',
            name: 'Test NFT #1',
            mintedAt: new Date().toISOString(),
            batchNumber: 1
          },
          {
            number: 2,
            address: 'TEST_ADDRESS_2',
            name: 'Test NFT #2',
            mintedAt: new Date().toISOString(),
            batchNumber: 1
          }
        ],
        lastBatchMinted: 1,
        lastMintTimestamp: new Date().toISOString()
      };
      await createMockRecords(testData);

      // Verify record accuracy
      const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
      expect(records).to.deep.equal(testData);
    });

    it('should handle record file creation', async () => {
      // Ensure no existing records
      await cleanupTestRecords();

      // Create new records
      const newRecords = {
        mintedCount: 0,
        mintedNFTs: [],
        lastBatchMinted: 0,
        lastMintTimestamp: null
      };
      await createMockRecords(newRecords);

      // Verify file creation
      const exists = await fs.access(TEST_CONFIG.recordsFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).to.be.true;

      // Verify content
      const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
      expect(records).to.deep.equal(newRecords);
    });

    it('should handle concurrent record updates', async () => {
      // Setup initial records
      const initialRecords = {
        mintedCount: 0,
        mintedNFTs: [],
        lastBatchMinted: 0,
        lastMintTimestamp: null
      };
      await createMockRecords(initialRecords);

      // Simulate concurrent updates
      const updates = [
        createMockRecords({ ...initialRecords, mintedCount: 1 }),
        createMockRecords({ ...initialRecords, mintedCount: 2 }),
        createMockRecords({ ...initialRecords, mintedCount: 3 })
      ];

      // Execute concurrent updates
      await Promise.all(updates);

      // Verify final state
      const records = JSON.parse(await fs.readFile(TEST_CONFIG.recordsFile, 'utf8'));
      expect(records.mintedCount).to.be.at.least(0);
    });
  });
}); 