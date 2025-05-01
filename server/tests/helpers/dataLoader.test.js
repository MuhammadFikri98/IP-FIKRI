const fs = require("fs");
const path = require("path");
const DataLoader = require("../../helpers/dataLoader");

// Mock fs and path
jest.mock("fs");
jest.mock("path");

describe("DataLoader Helper", () => {
  // Setup common mocks
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up path join mock to return predictable paths
    path.join.mockImplementation((...args) => args.join("/"));
  });

  describe("loadCountryMap", () => {
    test("Should read and parse country map correctly", () => {
      // Mock successful file read with sample data
      fs.readFileSync.mockReturnValue(
        JSON.stringify([
          { country: "United States", code: "us" },
          { country: "Germany", code: "de" },
          { country: "Japan", code: "jp" },
        ])
      );

      const countryMap = DataLoader.loadCountryMap();

      // Verify the map was created correctly
      expect(countryMap).toEqual({
        "United States": "us",
        Germany: "de",
        Japan: "jp",
      });

      // Verify the file path was constructed correctly
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("country.json"),
        "utf8"
      );
    });
  });

  describe("loadLanguageMap", () => {
    test("Should read and parse language map correctly", () => {
      // Mock successful file read with sample data
      fs.readFileSync.mockReturnValue(
        JSON.stringify([
          { language: "English", code: "en" },
          { language: "Spanish", code: "es" },
          { language: "French", code: "fr" },
        ])
      );

      const languageMap = DataLoader.loadLanguageMap();

      // Verify the map was created correctly
      expect(languageMap).toEqual({
        English: "en",
        Spanish: "es",
        French: "fr",
      });

      // Verify the file path was constructed correctly
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("language.json"),
        "utf8"
      );
    });
  });

  describe("Error handling", () => {
    test("Should handle file read errors gracefully for countries", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const countryMap = DataLoader.loadCountryMap();

      expect(countryMap).toBeDefined();
      expect(Object.keys(countryMap).length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("Should handle file read errors gracefully for languages", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const languageMap = DataLoader.loadLanguageMap();

      expect(languageMap).toBeDefined();
      expect(Object.keys(languageMap).length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("Should handle JSON parse errors gracefully", () => {
      // Mock file read with invalid JSON
      fs.readFileSync.mockReturnValue('{"invalid json');

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const countryMap = DataLoader.loadCountryMap();

      expect(countryMap).toBeDefined();
      expect(Object.keys(countryMap).length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // Add these tests to improve coverage of loadCountryData and loadLanguageData methods

  describe("loadCountryData", () => {
    test("Should load full country data array correctly", () => {
      // Mock successful file read with sample data
      fs.readFileSync.mockReturnValue(
        JSON.stringify([
          { country: "United States", code: "us" },
          { country: "Germany", code: "de" },
          { country: "Japan", code: "jp" },
        ])
      );

      const countryData = DataLoader.loadCountryData();

      // Verify we got an array
      expect(Array.isArray(countryData)).toBe(true);

      // Verify the data structure
      expect(countryData[0]).toHaveProperty("country");
      expect(countryData[0]).toHaveProperty("code");

      // Verify the mock was called
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("country.json"),
        "utf8"
      );
    });

    test("Should return default country data on file error", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const countryData = DataLoader.loadCountryData();

      // Should return default data
      expect(Array.isArray(countryData)).toBe(true);
      expect(countryData.length).toBeGreaterThan(0);
      expect(countryData[0]).toHaveProperty("country");
      expect(countryData[0]).toHaveProperty("code");
    });
  });

  describe("loadLanguageData", () => {
    test("Should load full language data array correctly", () => {
      // Mock successful file read with sample data
      fs.readFileSync.mockReturnValue(
        JSON.stringify([
          { language: "English", code: "en" },
          { language: "French", code: "fr" },
          { language: "Japanese", code: "ja" },
        ])
      );

      const languageData = DataLoader.loadLanguageData();

      // Verify we got an array
      expect(Array.isArray(languageData)).toBe(true);

      // Verify the data structure
      expect(languageData[0]).toHaveProperty("language");
      expect(languageData[0]).toHaveProperty("code");

      // Verify the mock was called
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("language.json"),
        "utf8"
      );
    });

    test("Should return default language data on file error", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const languageData = DataLoader.loadLanguageData();

      // Should return default data
      expect(Array.isArray(languageData)).toBe(true);
      expect(languageData.length).toBeGreaterThan(0);
      expect(languageData[0]).toHaveProperty("language");
      expect(languageData[0]).toHaveProperty("code");
    });
  });
});
