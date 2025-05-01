const NewsController = require("../../controllers/NewsController");
const GeminiHelper = require("../../helpers/gemini");
const DataLoader = require("../../helpers/dataLoader");
const { Collection } = require("../../models");
const axios = require("axios");

// Mock dependencies
jest.mock("axios");
jest.mock("../../models");
jest.mock("../../helpers/gemini");
jest.mock("../../helpers/dataLoader");

describe("NewsController - Edge Cases and Complete Coverage", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up request, response, and next function mocks
    req = {
      user: { id: 1 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    // Mock console methods to avoid cluttering test output
    console.log = jest.fn();
    console.error = jest.fn();

    // Set up basic mocks for DataLoader functions
    DataLoader.loadCountryMap.mockReturnValue({
      "United States": "us",
      Canada: "ca",
    });

    DataLoader.loadLanguageMap.mockReturnValue({
      English: "en",
      French: "fr",
    });

    DataLoader.loadCountryData.mockReturnValue([
      { code: "us", country: "United States" },
      { code: "ca", country: "Canada" },
    ]);

    DataLoader.loadLanguageData.mockReturnValue([
      { code: "en", language: "English" },
      { code: "fr", language: "French" },
    ]);

    // Mock process.env
    process.env.WORLD_NEWS_API_KEY = "test-api-key";
  });

  afterEach(() => {
    // Restore environment variables
    process.env.WORLD_NEWS_API_KEY = "test-api-key";
  });

  describe("getRecommendedNews - Unusual Edge Cases", () => {
    test("should handle API returning null data", async () => {
      // Setup
      Collection.findAll.mockResolvedValue([
        { country: "United States", language: "English", theme: "Technology" },
      ]);

      // Make API return null data
      axios.get.mockResolvedValue({
        status: 200,
        data: null,
      });

      // Execute
      await NewsController.getRecommendedNews(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          news: [],
          message: "No news found for your preferences",
        })
      );
    });

    test("should handle API returning undefined news array", async () => {
      // Setup
      Collection.findAll.mockResolvedValue([
        { country: "United States", language: "English", theme: "Technology" },
      ]);

      // API returns data but news array is undefined
      axios.get.mockResolvedValue({
        status: 200,
        data: { status: "ok" }, // No news property
      });

      // Execute
      await NewsController.getRecommendedNews(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          news: [],
          message: "No news found for your preferences",
        })
      );
    });

    test("should handle deep error in getAIRecommendation method", async () => {
      // Setup
      Collection.findAll.mockResolvedValue([
        { country: "United States", language: "English", theme: "Technology" },
      ]);

      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: [{ title: "Test Article", text: "Content" }],
        },
      });

      // Make GeminiHelper throw error and then fail on retry
      GeminiHelper.generateContent.mockRejectedValueOnce(new Error("AI Error"));
      GeminiHelper.generateContent.mockRejectedValueOnce(
        new Error("AI Error on retry")
      );

      // Execute
      await NewsController.getRecommendedNews(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          news: expect.any(Array),
          aiRecommendation: expect.stringContaining("Personalized News"),
        })
      );
    });
  });

  describe("buildNewsApiUrl - Edge Cases", () => {
    test("should handle empty or null theme", () => {
      // Test with null theme
      const urlWithNullTheme = NewsController.buildNewsApiUrl(
        "key",
        "us",
        "en",
        null
      );
      expect(urlWithNullTheme).not.toContain("text=");

      // Test with empty theme
      const urlWithEmptyTheme = NewsController.buildNewsApiUrl(
        "key",
        "us",
        "en",
        ""
      );
      expect(urlWithEmptyTheme).not.toContain("text=");
    });

    test("should have different date ranges for business themes", () => {
      // Business theme
      const businessUrl = NewsController.buildNewsApiUrl(
        "key",
        "us",
        "en",
        "Business"
      );
      expect(businessUrl).toContain("earliest-publish-date=");

      // Economy theme
      const economyUrl = NewsController.buildNewsApiUrl(
        "key",
        "us",
        "en",
        "Economy News"
      );
      expect(economyUrl).toContain("earliest-publish-date=");

      // Regular theme
      const regularUrl = NewsController.buildNewsApiUrl(
        "key",
        "us",
        "en",
        "Sports"
      );
      expect(regularUrl).toContain("earliest-publish-date=");

      // Business URL should have an earlier date than regular URL
      const businessDateParam = new URLSearchParams(
        businessUrl.split("?")[1]
      ).get("earliest-publish-date");
      const regularDateParam = new URLSearchParams(
        regularUrl.split("?")[1]
      ).get("earliest-publish-date");

      const businessDate = new Date(businessDateParam);
      const regularDate = new Date(regularDateParam);

      expect(businessDate.getTime()).toBeLessThan(regularDate.getTime());
    });
  });

  describe("processNewsArticles - Edge Cases", () => {
    test("should handle missing fields gracefully", () => {
      const articles = [
        { title: "Article with minimal data" }, // No text, summary, url, etc.
        {
          title: "Article with null fields",
          text: null,
          summary: null,
          url: null,
        },
        {
          title: "Complete article",
          text: "Full article text",
          summary: "Article summary",
          url: "https://example.com",
          image: "https://example.com/image.jpg",
          source: "Test Source",
        },
      ];

      const processed = NewsController.processNewsArticles(
        articles,
        "us",
        "en",
        "United States"
      );

      // First article should still be processed correctly with defaults
      expect(processed[0]).toEqual(
        expect.objectContaining({
          title: "Article with minimal data",
          description: "",
          urlToImage: expect.stringContaining("placeholder"),
          summary: "",
        })
      );

      // Second article should have default values
      expect(processed[1]).toEqual(
        expect.objectContaining({
          title: "Article with null fields",
          description: "",
          urlToImage: expect.stringContaining("placeholder"),
          summary: "",
        })
      );

      // Complete article should maintain all its data
      expect(processed[2]).toEqual(
        expect.objectContaining({
          title: "Complete article",
          description: "Full article text",
          url: "https://example.com",
          urlToImage: "https://example.com/image.jpg",
          summary: "Article summary",
          source: { name: "Test Source" },
        })
      );
    });

    test("should handle extra fields in news articles", () => {
      const articles = [
        {
          title: "Test with extra fields",
          text: "Content",
          unknown_field: "Unknown",
          custom_data: { nested: "data" },
        },
      ];

      const processed = NewsController.processNewsArticles(
        articles,
        "us",
        "en",
        "United States"
      );

      // Should not error on extra fields
      expect(processed[0]).toEqual(
        expect.objectContaining({
          title: "Test with extra fields",
          description: "Content",
        })
      );
    });
  });

  describe("generateAIRecommendation - Edge Cases", () => {
    test("should handle articles with no theme relevance", async () => {
      // Articles that don't match theme
      const articles = [
        { title: "Sports news", summary: "All about sports" },
        { title: "Political update", summary: "Latest politics" },
      ];

      // Expect theme "Technology" won't match articles
      GeminiHelper.generateContent.mockResolvedValue(
        "AI Recommendation for non-matching theme"
      );

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en"
      );

      // Should use non-matching theme prompt
      expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "don't seem to match the user's theme preference"
        )
      );
      expect(result).toBe("AI Recommendation for non-matching theme");
    });

    test("should handle empty articles array", async () => {
      const emptyArticles = [];

      GeminiHelper.generateContent.mockResolvedValue(
        "AI Recommendation for empty articles"
      );

      const result = await NewsController.generateAIRecommendation(
        emptyArticles,
        "United States",
        "English",
        "Technology",
        "us",
        "en"
      );

      expect(result).toBe("AI Recommendation for empty articles");
    });

    test("should retry with simpler prompt when AI generation fails", async () => {
      const articles = [
        { index: 0, title: "Tech news", summary: "About technology" },
      ];

      // First call fails, second succeeds
      GeminiHelper.generateContent
        .mockResolvedValueOnce("Unable to generate AI recommendation")
        .mockResolvedValueOnce("Simple recommendation");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en"
      );

      // Should have called generateContent twice
      expect(GeminiHelper.generateContent).toHaveBeenCalledTimes(2);
      expect(GeminiHelper.generateContent.mock.calls[1][0]).toContain(
        "simpler prompt"
      );
      expect(result).toBe("Simple recommendation");
    });

    test("should fall back to mock when all AI attempts fail", async () => {
      const articles = [
        { index: 0, title: "Tech news", summary: "About technology" },
      ];

      // Both attempts fail
      GeminiHelper.generateContent
        .mockResolvedValueOnce("Unable to generate AI recommendation")
        .mockResolvedValueOnce("Unable to generate AI recommendation");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en"
      );

      // Should return mock recommendation
      expect(result).toContain("Personalized News Recommendations");
      expect(result).toContain("Top Recommendations");
    });
  });

  describe("Helper Methods - Edge Cases", () => {
    test("should handle getCountryCode with invalid inputs", () => {
      expect(NewsController.getCountryCode(null)).toBe("us");
      expect(NewsController.getCountryCode(undefined)).toBe("us");
      expect(NewsController.getCountryCode("")).toBe("us");
      expect(NewsController.getCountryCode("Non-existent country")).toBe("us");
    });

    test("should handle getLanguageCode with invalid inputs", () => {
      expect(NewsController.getLanguageCode(null)).toBe("en");
      expect(NewsController.getLanguageCode(undefined)).toBe("en");
      expect(NewsController.getLanguageCode("")).toBe("en");
      expect(NewsController.getLanguageCode("Non-existent language")).toBe(
        "en"
      );
    });

    test("should handle getCountryName with different input types", () => {
      // Already a full name
      expect(NewsController.getCountryName("United States")).toBe(
        "United States"
      );

      // Code that exists
      expect(NewsController.getCountryName("us")).toBe("United States");

      // Code that doesn't exist
      expect(NewsController.getCountryName("zz")).toBe("United States");

      // Error case
      DataLoader.loadCountryData.mockImplementationOnce(() => {
        throw new Error("Data loading error");
      });
      expect(NewsController.getCountryName("us")).toBe("United States");
    });

    test("should handle getLanguageName with different input types", () => {
      // Already a full name
      expect(NewsController.getLanguageName("English")).toBe("English");

      // Code that exists
      expect(NewsController.getLanguageName("en")).toBe("English");

      // Code that doesn't exist
      expect(NewsController.getLanguageName("zz")).toBe("English");

      // Error case
      DataLoader.loadLanguageData.mockImplementationOnce(() => {
        throw new Error("Data loading error");
      });
      expect(NewsController.getLanguageName("en")).toBe("English");
    });
  });

  describe("generateMockNews - Edge Cases", () => {
    test("should convert country code to name", () => {
      const mockNews = NewsController.generateMockNews(
        "us",
        "en",
        "Technology"
      );

      // Should have used the full name in the titles and descriptions
      expect(mockNews[0].title).toContain("United States");
      expect(mockNews[0].description).toContain("United States");
    });

    test("should convert language code to name", () => {
      const mockNews = NewsController.generateMockNews(
        "United States",
        "en",
        "Technology"
      );

      // Should have used the full name in the descriptions
      expect(mockNews[0].description).toContain("English");
    });

    test("should handle non-existent country/language codes", () => {
      // Mock DataLoader to return empty arrays
      DataLoader.loadCountryData.mockReturnValueOnce([]);
      DataLoader.loadLanguageData.mockReturnValueOnce([]);

      const mockNews = NewsController.generateMockNews(
        "zz",
        "yy",
        "Technology"
      );

      // Should still generate news with the codes as names
      expect(mockNews[0].title).toContain("Technology");
      expect(mockNews[0].country).toBe("zz");
      expect(mockNews[0].language).toBe("yy");
    });
  });
});
