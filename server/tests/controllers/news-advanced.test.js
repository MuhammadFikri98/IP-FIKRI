const NewsController = require("../../controllers/NewsController");
const { Collection } = require("../../models");
const axios = require("axios");
const DataLoader = require("../../helpers/dataLoader");

// Mock dependencies
jest.mock("../../models");
jest.mock("axios");
jest.mock("../../helpers/dataLoader");

describe("NewsController - Additional Branch Coverage", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request with authenticated user
    req = {
      user: { id: 1 },
    };

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup next function
    next = jest.fn();

    // Set API key
    process.env.WORLD_NEWS_API_KEY = "test-api-key";

    // Mock DataLoader methods with default maps
    DataLoader.loadCountryMap.mockReturnValue({
      "United States": "us",
      Japan: "jp",
      Germany: "de",
    });

    DataLoader.loadLanguageMap.mockReturnValue({
      English: "en",
      Japanese: "ja",
      German: "de",
    });
  });

  describe("getCountryCode", () => {
    test("should return correct code for valid country", () => {
      expect(NewsController.getCountryCode("United States")).toBe("us");
      expect(NewsController.getCountryCode("Japan")).toBe("jp");
    });

    test("should return default us code for invalid country", () => {
      expect(NewsController.getCountryCode("Wakanda")).toBe("us");
    });

    test("should return default us code for undefined input", () => {
      expect(NewsController.getCountryCode(undefined)).toBe("us");
      expect(NewsController.getCountryCode(null)).toBe("us");
    });
  });

  describe("getLanguageCode", () => {
    test("should return correct code for valid language", () => {
      expect(NewsController.getLanguageCode("English")).toBe("en");
      expect(NewsController.getLanguageCode("Japanese")).toBe("ja");
    });

    test("should return default en code for invalid language", () => {
      expect(NewsController.getLanguageCode("Klingon")).toBe("en");
    });

    test("should return default en code for undefined input", () => {
      expect(NewsController.getLanguageCode(undefined)).toBe("en");
      expect(NewsController.getLanguageCode(null)).toBe("en");
    });
  });

  describe("getRecommendedNews", () => {
    test("should handle API errors with error response object", async () => {
      // Mock Collections
      Collection.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Mock API error with response object
      const errorResponse = {
        response: {
          status: 400,
          data: { error: "Server error" },
        },
      };
      axios.get.mockRejectedValue(errorResponse);

      // Call the controller
      await NewsController.getRecommendedNews(req, res, next);

      // Verify error handling
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "BadRequest",
          message: expect.stringContaining("Error fetching news"),
        })
      );
    });

    test("should handle API errors without response object", async () => {
      // Mock Collections
      Collection.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Mock API error without response object (e.g., network error)
      const error = new Error("Network error");
      axios.get.mockRejectedValue(error);

      // Call the controller
      await NewsController.getRecommendedNews(req, res, next);

      // Verify error handling
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "BadRequest",
          message: expect.stringContaining("Network error"),
        })
      );
    });

    test("should handle missing API key", async () => {
      // Mock Collections
      Collection.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Remove API key
      delete process.env.WORLD_NEWS_API_KEY;

      // Call the controller
      await NewsController.getRecommendedNews(req, res, next);

      // Verify error handling
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "BadRequest",
          message: "WorldNews API key is not configured",
        })
      );
    });
  });
});
