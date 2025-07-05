module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Match the asyncUtilTimeout in setupTests.ts (5 seconds)
  testTimeout: 5000,
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js',
    '@shared/(.*)': '<rootDir>/../shared/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js}',
    '<rootDir>/../shared/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/../shared/**/*.{test,spec}.{ts,tsx,js}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '../shared/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!../shared/**/*.d.ts',
  ],
};
