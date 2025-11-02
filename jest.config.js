module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/*.test.js',
    '**/tests/**/*.js'
  ],
  collectCoverageFrom: [
    '.aios-core/utils/**/*.js',
    'aios-fullstack/install/**/*.js',
    'scripts/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.husky/',
    '/dist/'
  ],
  // Cross-platform test configuration
  testTimeout: 30000, // 30 seconds for install operations
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
