import fs from 'fs/promises';
import { TEST_CONFIG } from '../setup.js';

export async function cleanupTestRecords() {
  try {
    await fs.unlink(TEST_CONFIG.recordsFile);
  } catch (error) {
    // File might not exist, ignore
  }
}

export async function createMockRecords(data) {
  await fs.writeFile(TEST_CONFIG.recordsFile, JSON.stringify(data, null, 2));
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 