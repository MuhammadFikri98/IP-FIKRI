const fs = require("fs");
const path = require("path");
const DataLoader = require("../../helpers/dataLoader");

// Mock the fs module
jest.mock("fs");
jest.mock("path");

describe("DataLoader Helper", () => {
  // Mock data
  const mockCountryData = [
    { country: "United States", code: "us" },
    { country: "United Kingdom", code: "gb" },
    { country: "Japan", code: "jp" },
  ];

  const mockLanguageData = [
    { language: "English", code: "en" },
    { language: "Spanish", code: "es" },
    { language: "French", code: "fr" },
  ];

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock path.join to return expected values
    path.join.mockImplementation(() => "mocked/path");
  });

  describe("loadCountryMap", () => {
    test("should load and transform country data into a map", () => {
      // Mock successful file read
      fs.readFileSync.mockReturnValue(JSON.stringify(mockCountryData));

      const result = DataLoader.loadCountryMap();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      expect(result).toEqual({
        "United States": "us",
        "United Kingdom": "gb",
        Japan: "jp",
      });
    });

    test("should return default map when file read fails", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = DataLoader.loadCountryMap();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      // Verify it contains at least some default values
      expect(result).toHaveProperty("United States", "us");
      expect(result).toHaveProperty("Indonesia", "id");
      expect(Object.keys(result).length).toBeGreaterThan(5);
    });
  });

  describe("loadLanguageMap", () => {
    test("should load and transform language data into a map", () => {
      // Mock successful file read
      fs.readFileSync.mockReturnValue(JSON.stringify(mockLanguageData));

      const result = DataLoader.loadLanguageMap();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      expect(result).toEqual({
        English: "en",
        Spanish: "es",
        French: "fr",
      });
    });

    test("should return default map when file read fails", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = DataLoader.loadLanguageMap();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      // Verify it contains some default values
      expect(result).toHaveProperty("English", "en");
      expect(result).toHaveProperty("Indonesian", "id");
      expect(Object.keys(result).length).toBeGreaterThan(5);
    });
  });

  describe("loadCountryData", () => {
    test("should load full country data array", () => {
      // Mock successful file read
      fs.readFileSync.mockReturnValue(JSON.stringify(mockCountryData));

      const result = DataLoader.loadCountryData();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      expect(result).toEqual(mockCountryData);
    });

    test("should return default country data when file read fails", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = DataLoader.loadCountryData();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      // Verify it's an array with expected structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("country");
      expect(result[0]).toHaveProperty("code");
    });
  });

  describe("loadLanguageData", () => {
    test("should load full language data array", () => {
      // Mock successful file read
      fs.readFileSync.mockReturnValue(JSON.stringify(mockLanguageData));

      const result = DataLoader.loadLanguageData();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      expect(result).toEqual(mockLanguageData);
    });

    test("should return default language data when file read fails", () => {
      // Mock file read error
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = DataLoader.loadLanguageData();

      expect(fs.readFileSync).toHaveBeenCalledWith("mocked/path", "utf8");
      // Verify it's an array with expected structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("language");
      expect(result[0]).toHaveProperty("code");
    });
  });
});
