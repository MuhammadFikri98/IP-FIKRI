module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Gunakan text reporter untuk menampilkan hasil coverage di terminal dengan jelas
  coverageReporters: ["text", "lcov"],

  // File yang akan dihitung dalam perhitungan coverage
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/jest.config.js",
    "!**/bin/**",
    "!**/migrations/**",
    "!**/seeders/**",
    "!**/tests/**",
    "!**/test-output.txt",
    "!**/show-coverage.js",
  ],

  // Target coverage minimum 90%
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Deteksi open handles untuk menghindari memory leaks
  detectOpenHandles: true,

  // Run in band agar test berjalan secara sequential, tidak paralel
  runInBand: true,

  // Force exit untuk menghindari test yang hanging
  forceExit: true,
};
