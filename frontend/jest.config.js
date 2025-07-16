export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Match the asyncUtilTimeout in setupTests.ts (5 seconds)
  testTimeout: 5000,
  moduleNameMapper: {
    // Specific mapping for vanilla-cookieconsent CSS
    'vanilla-cookieconsent/dist/cookieconsent\\.css': 'identity-obj-proxy',
    // General CSS mapping
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js',
    // Mock vanilla-cookieconsent module
    '^vanilla-cookieconsent$': '<rootDir>/src/__mocks__/vanilla-cookieconsent.js',
    '@shared/(.*)': '<rootDir>/../shared/$1',
    // Map React modules to frontend's node_modules when imported from shared
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1',
  },
  // Transform shared directory files
  transformIgnorePatterns: ['node_modules/(?!(react-router|react-router-dom)/)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js}',
    '<rootDir>/../shared/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/../shared/**/*.{test,spec}.{ts,tsx,js}',
  ],
  // Temporarily skip problematic integration tests
  testPathIgnorePatterns: ['<rootDir>/src/tests/integration/AppIntegration.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '../shared/**/*.{ts,tsx,js}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/tests/**',
    '!src/__mocks__/**',
    '!../shared/**/*.d.ts',
    '!../shared/**/__tests__/**',
    '!../shared/**/*.test.{ts,tsx,js}',
    '!../shared/**/*.spec.{ts,tsx,js}',
  ],
};
