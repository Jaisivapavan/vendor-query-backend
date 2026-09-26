module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/frontend/'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
};
