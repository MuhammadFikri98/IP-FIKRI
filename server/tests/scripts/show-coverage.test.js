const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// Mock dependencies
jest.mock("fs");
jest.mock("child_process");

describe("show-coverage script", () => {
  let showCoverageScript;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Reset modules to ensure clean tests
    jest.resetModules();
  });

  test("should handle existing test output file", () => {
    // Mock file existence and content
    const mockTestOutput = `
Test Suites: 5 failed, 10 passed, 15 total
Tests: 20 failed, 50 passed, 70 total
Snapshots: 0 total
Time: 10.5s

------------------------|---------|----------|---------|---------|-------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------------------|---------|----------|---------|---------|-------------------
All files               |   85.2  |    80.5  |   83.7  |   85.5  |                   
 controllers            |   88.4  |    85.2  |   90.1  |   88.7  |                   
  AuthController.js     |   95.7  |    90.0  |  100.0  |   95.7  | 24-25             
------------------------|---------|----------|---------|---------|-------------------
`;

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockTestOutput);

    // Import and run the script
    require("../../show-coverage");

    // Verify behavior
    expect(fs.existsSync).toHaveBeenCalledWith("test-output.txt");
    expect(fs.readFileSync).toHaveBeenCalledWith("test-output.txt", "utf8");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("TEST SUMMARY")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("COVERAGE REPORT")
    );
  });

  test("should handle missing test output file", () => {
    // Mock file not existing
    fs.existsSync.mockReturnValue(false);

    // Mock execSync for the direct test execution
    execSync.mockImplementation(() => "Test execution output");

    // Import and run the script
    require("../../show-coverage");

    // Verify behavior
    expect(fs.existsSync).toHaveBeenCalledWith("test-output.txt");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Test output file not found")
    );
    expect(execSync).toHaveBeenCalled();
  });

  test("should handle errors when reading test output", () => {
    // Mock file existence but reading error
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => {
      throw new Error("Read error");
    });

    // Import and run the script
    require("../../show-coverage");

    // Verify behavior
    expect(fs.existsSync).toHaveBeenCalledWith("test-output.txt");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error reading test output")
    );
  });
});
