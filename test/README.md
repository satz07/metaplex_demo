# NFT Minting Tests

This directory contains the test suite for the NFT minting functionality.

## Structure

```
test/
├── fixtures/          # Test data and mock files
├── utils/            # Test utilities and helpers
├── setup.js          # Test environment setup
├── nft.test.js       # Main test file
└── README.md         # Test documentation
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Categories

1. **Batch Minting**
   - Batch creation
   - Duplicate prevention
   - Sequential enforcement

2. **Record Keeping**
   - Record accuracy
   - File handling
   - Data persistence

3. **Error Handling**
   - Invalid inputs
   - Network errors
   - Rate limiting

## Writing Tests

1. Use the provided test utilities:
   ```javascript
   import { cleanupTestRecords, createMockRecords } from './utils/helpers.js';
   ```

2. Follow the test structure:
   ```javascript
   describe('Feature', () => {
     before(() => {
       // Setup
     });

     it('should do something', async () => {
       // Test
     });
   });
   ```

## Mocks and Fixtures

Test data is stored in `fixtures/`. To add new mock data:

1. Create a JSON file in `fixtures/`
2. Import in tests using the helpers
3. Clean up after tests

## Coverage

Coverage reports are generated in the `coverage/` directory when running:
```bash
npm run test:coverage
```

## Best Practices

1. Clean up after tests
2. Use meaningful test descriptions
3. Test edge cases
4. Keep tests independent
5. Use before/after hooks appropriately

## Contributing

When adding new tests:
1. Follow the existing structure
2. Add documentation
3. Include both positive and negative cases
4. Update this README if needed 