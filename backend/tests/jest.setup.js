// Jest setup configuration
const dotenv = require('dotenv');
require('jest-expect-message');

// Load environment variables from .env file
dotenv.config();

// Set a longer timeout for tests that might need more time (e.g. API calls)
jest.setTimeout(30000);

// Global teardown function to clean up resources after all tests
global.afterAll = async () => {
  // Add any global cleanup here if needed
  console.log('Global teardown complete');
}; 