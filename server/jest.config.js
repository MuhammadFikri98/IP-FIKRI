module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Coverage reporters to use
  // 'text' reporter will show the detailed coverage table
  // We'll use it with the --silent flag to suppress other outputs
  coverageReporters: ["text", "lcov", "clover", "json"],

  // Files to include in coverage calculation
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/tests/**",
    "!jest.config.js",
  ],

  // Show coverage summary after all tests have run
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },

  // Make test output less noisy
  reporters: ["default"],

  // Detect open handles (like database connections) that weren't closed
  detectOpenHandles: true,

  // Run tests in a single process rather than in parallel
  runInBand: true,

  // Force Jest to exit after all tests have completed
  forceExit: true,
};
