module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'backend/src/**/*.{js,jsx,ts,tsx}',
    '!backend/src/**/*.d.ts',
    '!backend/src/server.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 49,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
} 