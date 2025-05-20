import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup global mocks
global.window = global.window || {};
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Make sure vi is available globally for mocking
global.vi = vi;

// Add Jest compatibility layer for tests that use Jest syntax
global.jest = {
  fn: vi.fn,
  mock: vi.mock,
  spyOn: vi.spyOn,
};

// Add Jest globals
global.describe = describe;
global.it = it;
global.test = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
