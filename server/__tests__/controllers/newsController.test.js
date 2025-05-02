const { NewsController } = require("../../controllers");
const { Collection } = require("../../models");
const GeminiHelper = require("../../helpers/gemini");
const DataLoader = require("../../helpers/dataLoader");
const axios = require("axios");

// Mock dependencies
jest.mock("../../models");
jest.mock("../../helpers/gemini");
jest.mock("../../helpers/dataLoader");
jest.mock("axios");

describe("NewsController", () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    // Save original process.env
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe("getRecommendedNews", () => {
    test("should return 400 if user has no collections", async () => {
      // Mock empty collections
      Collection.findAll.mockResolvedValue([]);

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(Collection.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(next).toHaveBeenCalled();
      // The error should be passed to next
      expect(next.mock.calls[0][0]).toHaveProperty("name", "BadRequest");
      expect(next.mock.calls[0][0]).toHaveProperty(
        "message",
        "You need to create collections first to get personalized news recommendations"
      );
    });

    test("should return 400 if latest collection is missing required fields", async () => {
      // Mock collection with missing fields
      const incompleteCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: null, // missing language
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([incompleteCollection]);

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(Collection.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toHaveProperty("name", "BadRequest");
      expect(next.mock.calls[0][0]).toHaveProperty(
        "message",
        "Your collection is missing required information (country, language, or theme)"
      );
    });

    test("should use mock data when API key is not configured", async () => {
      // Mock collection with all required fields
      const validCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: "en",
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock data loader responses
      DataLoader.loadCountryMap.mockReturnValue({ US: "us" });
      DataLoader.loadLanguageMap.mockReturnValue({ en: "en" });
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
      ]);
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
      ]);

      // Set up mock for generateMockNews
      const mockNews = [{ title: "Mock News Article" }];
      jest.spyOn(NewsController, "generateMockNews").mockReturnValue(mockNews);

      // Remove API key from env
      delete process.env.WORLD_NEWS_API_KEY;

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(Collection.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        news: mockNews,
        message: "Using demo data (API key not configured)",
        userPreferences: { country: "US", language: "en", theme: "Technology" },
      });
    });

    test("should handle successful API response with articles", async () => {
      // Mock collection
      const validCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: "en",
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock data loader responses
      DataLoader.loadCountryMap.mockReturnValue({ US: "us" });
      DataLoader.loadLanguageMap.mockReturnValue({ en: "en" });
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
      ]);
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
      ]);

      // Mock API key
      process.env.WORLD_NEWS_API_KEY = "test-api-key";

      // Mock API response
      const mockNewsArticles = [
        {
          title: "Test Article",
          text: "This is a test article about technology",
          url: "https://example.com",
          image: "https://example.com/image.jpg",
          publish_date: "2025-04-30",
        },
      ];
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: mockNewsArticles,
        },
      });

      // Mock methods
      jest
        .spyOn(NewsController, "buildNewsApiUrl")
        .mockReturnValue("https://api.example.com");
      jest.spyOn(NewsController, "processNewsArticles").mockReturnValue([
        {
          title: "Test Article (Processed)",
          description: "Processed description",
          url: "https://example.com",
        },
      ]);

      // Mock AI recommendation
      const mockRecommendation = "AI recommendation text";
      jest
        .spyOn(NewsController, "generateAIRecommendation")
        .mockResolvedValue(mockRecommendation);

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(axios.get).toHaveBeenCalledWith("https://api.example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        news: expect.any(Array),
        aiRecommendation: mockRecommendation,
        userPreferences: { country: "US", language: "en", theme: "Technology" },
      });
    });

    test("should handle API response with no articles", async () => {
      // Mock collection
      const validCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: "en",
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock data loader responses
      DataLoader.loadCountryMap.mockReturnValue({ US: "us" });
      DataLoader.loadLanguageMap.mockReturnValue({ en: "en" });
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
      ]);
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
      ]);

      // Mock API key
      process.env.WORLD_NEWS_API_KEY = "test-api-key";

      // Mock API response with empty news array
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: [],
        },
      });

      // Mock method
      jest
        .spyOn(NewsController, "buildNewsApiUrl")
        .mockReturnValue("https://api.example.com");

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(axios.get).toHaveBeenCalledWith("https://api.example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        news: [],
        message: "No news found for your preferences",
        userPreferences: { country: "US", language: "en", theme: "Technology" },
      });
    });

    test("should handle payment required API error (402)", async () => {
      // Mock collection
      const validCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: "en",
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock data loader responses
      DataLoader.loadCountryMap.mockReturnValue({ US: "us" });
      DataLoader.loadLanguageMap.mockReturnValue({ en: "en" });

      // Mock API key
      process.env.WORLD_NEWS_API_KEY = "test-api-key";

      // Mock API error with 402 status
      axios.get.mockRejectedValue({
        response: {
          status: 402,
          data: { message: "Payment required" },
        },
        message: "Request failed with status code 402",
      });

      // Mock method
      jest
        .spyOn(NewsController, "buildNewsApiUrl")
        .mockReturnValue("https://api.example.com");

      // Set up mock for generateMockNews
      const mockNews = [{ title: "Mock News for 402 Error" }];
      jest.spyOn(NewsController, "generateMockNews").mockReturnValue(mockNews);

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(axios.get).toHaveBeenCalledWith("https://api.example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        news: mockNews,
        message: "Using demo data (API requires payment)",
        userPreferences: { country: "US", language: "en", theme: "Technology" },
      });
    });

    test("should handle other API errors", async () => {
      // Mock collection
      const validCollection = {
        id: 1,
        userId: 1,
        country: "US",
        language: "en",
        theme: "Technology",
      };
      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock data loader responses
      DataLoader.loadCountryMap.mockReturnValue({ US: "us" });
      DataLoader.loadLanguageMap.mockReturnValue({ en: "en" });

      // Mock API key
      process.env.WORLD_NEWS_API_KEY = "test-api-key";

      // Mock API error (not 402)
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
        message: "Request failed with status code 500",
      });

      // Mock method
      jest
        .spyOn(NewsController, "buildNewsApiUrl")
        .mockReturnValue("https://api.example.com");

      const req = {
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await NewsController.getRecommendedNews(req, res, next);

      expect(axios.get).toHaveBeenCalledWith("https://api.example.com");
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toHaveProperty("name", "BadRequest");
      expect(next.mock.calls[0][0].message).toContain("Error fetching news");
    });
  });

  describe("buildNewsApiUrl", () => {
    test("should build correct URL with all parameters", () => {
      const apiKey = "test-api-key";
      const countryCode = "us";
      const languageCode = "en";
      const theme = "Technology";

      const result = NewsController.buildNewsApiUrl(
        apiKey,
        countryCode,
        languageCode,
        theme
      );

      expect(result).toContain("https://api.worldnewsapi.com/search-news");
      expect(result).toContain("api-key=test-api-key");
      expect(result).toContain("language=en");
      expect(result).toContain("source-countries=us");
      expect(result).toContain("text=Technology");
      expect(result).toContain("number=10");
      expect(result).toContain("sort=publish-time");
      expect(result).toContain("sort-direction=desc");
      expect(result).toContain("earliest-publish-date=");
    });

    test("should use longer date range for business/economy theme", () => {
      const apiKey = "test-api-key";
      const countryCode = "us";
      const languageCode = "en";
      const theme = "Business and Economy";

      const result = NewsController.buildNewsApiUrl(
        apiKey,
        countryCode,
        languageCode,
        theme
      );

      // Get today's date and 7 days ago for comparison
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      expect(result).toContain(`earliest-publish-date=${sevenDaysAgo}`);
    });
  });

  describe("processNewsArticles", () => {
    test("should correctly transform article data", () => {
      const newsArticles = [
        {
          title: "Test Article",
          text: "This is a long article text that should be truncated in the description",
          url: "https://example.com/article",
          image: "https://example.com/image.jpg",
          publish_date: "2025-04-30",
          source: "Example News",
          author: "John Doe",
          sentiment: "positive",
          categories: ["technology", "ai"],
        },
      ];
      const countryCode = "us";
      const languageCode = "en";
      const countryName = "United States";

      const result = NewsController.processNewsArticles(
        newsArticles,
        countryCode,
        languageCode,
        countryName
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: "Test Article",
        description:
          "This is a long article text that should be truncated in the description",
        url: "https://example.com/article",
        urlToImage: "https://example.com/image.jpg",
        publishedAt: "2025-04-30",
        source: {
          name: "Example News",
        },
        country: "us",
        language: "en",
        summary:
          "This is a long article text that should be truncated in the description",
        author: "John Doe",
        sentiment: "positive",
        categories: ["technology", "ai"],
      });
    });

    test("should handle missing data in articles", () => {
      const newsArticles = [
        {
          title: "Test Article",
          url: "https://example.com/article",
          publish_date: "2025-04-30",
        },
      ];
      const countryCode = "us";
      const languageCode = "en";
      const countryName = "United States";

      const result = NewsController.processNewsArticles(
        newsArticles,
        countryCode,
        languageCode,
        countryName
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: "Test Article",
        description: "",
        url: "https://example.com/article",
        urlToImage: "https://via.placeholder.com/600x400?text=No+Image",
        publishedAt: "2025-04-30",
        source: {
          name: "United States",
        },
        country: "us",
        language: "en",
        summary: "",
        author: undefined,
        sentiment: undefined,
        categories: undefined,
      });
    });
  });

  describe("generateAIRecommendation", () => {
    test("should use Gemini to generate recommendation when AI available", async () => {
      const articles = [
        {
          title: "AI Article 1",
          description: "Description 1",
          summary: "Summary 1",
          source: { name: "Source 1" },
          publishedAt: "2025-04-30",
        },
        {
          title: "AI Article 2",
          description: "Description 2",
          summary: "Summary 2",
          source: { name: "Source 2" },
          publishedAt: "2025-04-29",
        },
      ];

      const mockAIResponse = "AI generated recommendation";
      GeminiHelper.generateContent.mockResolvedValue(mockAIResponse);

      // Mock the prompt builders
      jest
        .spyOn(NewsController, "buildMatchingThemePrompt")
        .mockReturnValue("Matching theme prompt");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        false // Not using mock data
      );

      expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
        "Matching theme prompt"
      );
      expect(result).toBe(mockAIResponse);
    });

    test("should use mock recommendation when useMockData is true", async () => {
      const articles = [
        {
          title: "Mock Article 1",
          description: "Description 1",
        },
      ];

      const mockRecommendation = "Mock recommendation";
      jest
        .spyOn(NewsController, "generateMockRecommendation")
        .mockReturnValue(mockRecommendation);

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        true // Using mock data
      );

      expect(NewsController.generateMockRecommendation).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).not.toHaveBeenCalled();
      expect(result).toBe(mockRecommendation);
    });

    test("should use simpler prompt if first AI generation fails", async () => {
      const articles = [
        {
          title: "AI Article 1",
          description: "Description 1",
          summary: "Summary 1",
          source: { name: "Source 1" },
          publishedAt: "2025-04-30",
        },
      ];

      // First call fails, second call succeeds
      GeminiHelper.generateContent
        .mockResolvedValueOnce("Unable to generate content")
        .mockResolvedValueOnce("Second attempt successful");

      // Mock the prompt builders
      jest
        .spyOn(NewsController, "buildMatchingThemePrompt")
        .mockReturnValue("Matching theme prompt");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        false // Not using mock data
      );

      expect(GeminiHelper.generateContent).toHaveBeenCalledTimes(2);
      expect(GeminiHelper.generateContent.mock.calls[1][0]).toContain(
        "Recommend 3 news articles"
      );
      expect(result).toBe("Second attempt successful");
    });

    test("should fall back to mock if all AI attempts fail", async () => {
      const articles = [
        {
          title: "AI Article 1",
          description: "Description 1",
        },
      ];

      // Both AI calls fail
      GeminiHelper.generateContent
        .mockResolvedValueOnce("Unable to generate content")
        .mockResolvedValueOnce("Unable to generate content");

      const mockRecommendation = "Fallback mock recommendation";
      jest
        .spyOn(NewsController, "generateMockRecommendation")
        .mockReturnValue(mockRecommendation);

      // Mock the prompt builders
      jest
        .spyOn(NewsController, "buildMatchingThemePrompt")
        .mockReturnValue("Matching theme prompt");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        false // Not using mock data, but will fall back
      );

      expect(GeminiHelper.generateContent).toHaveBeenCalledTimes(2);
      expect(NewsController.generateMockRecommendation).toHaveBeenCalled();
      expect(result).toBe(mockRecommendation);
    });

    test("should handle errors during AI generation", async () => {
      const articles = [
        {
          title: "AI Article 1",
          description: "Description 1",
        },
      ];

      // AI throws an error
      GeminiHelper.generateContent.mockRejectedValue(
        new Error("AI generation error")
      );

      const mockRecommendation = "Error fallback recommendation";
      jest
        .spyOn(NewsController, "generateMockRecommendation")
        .mockReturnValue(mockRecommendation);

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        false // Not using mock data, but will fall back due to error
      );

      expect(GeminiHelper.generateContent).toHaveBeenCalled();
      expect(NewsController.generateMockRecommendation).toHaveBeenCalled();
      expect(result).toBe(mockRecommendation);
    });

    test("should use non-matching theme prompt when no relevant articles found", async () => {
      const articles = [
        {
          title: "Article about sports",
          summary: "Sports content",
          url: "https://example.com/sports",
        },
      ];

      // Mock successful AI response
      GeminiHelper.generateContent.mockResolvedValue("AI recommendation");

      // Mock the prompt builders
      jest
        .spyOn(NewsController, "buildNonMatchingThemePrompt")
        .mockReturnValue("Non-matching theme prompt");

      const result = await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology", // Theme doesn't match the sports article
        "us",
        "en",
        false
      );

      expect(NewsController.buildNonMatchingThemePrompt).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
        "Non-matching theme prompt"
      );
      expect(result).toBe("AI recommendation");
    });
  });

  describe("helper methods", () => {
    test("getCountryCode should return code for valid country name", () => {
      DataLoader.loadCountryMap.mockReturnValue({
        "United States": "us",
        Japan: "jp",
      });

      expect(NewsController.getCountryCode("United States")).toBe("us");
      expect(NewsController.getCountryCode("Japan")).toBe("jp");
    });

    test("getCountryCode should return default for invalid country name", () => {
      DataLoader.loadCountryMap.mockReturnValue({
        "United States": "us",
      });

      expect(NewsController.getCountryCode("Unknown Country")).toBe("us");
      expect(NewsController.getCountryCode(null)).toBe("us");
    });

    test("getLanguageCode should return code for valid language name", () => {
      DataLoader.loadLanguageMap.mockReturnValue({
        English: "en",
        Japanese: "ja",
      });

      expect(NewsController.getLanguageCode("English")).toBe("en");
      expect(NewsController.getLanguageCode("Japanese")).toBe("ja");
    });

    test("getLanguageCode should return default for invalid language name", () => {
      DataLoader.loadLanguageMap.mockReturnValue({
        English: "en",
      });

      expect(NewsController.getLanguageCode("Unknown Language")).toBe("en");
      expect(NewsController.getLanguageCode(null)).toBe("en");
    });

    test("getCountryName should handle country codes and names", () => {
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
        { country: "Japan", code: "jp" },
      ]);

      // Already a full name
      expect(NewsController.getCountryName("United Kingdom")).toBe(
        "United Kingdom"
      );

      // Convert code to name
      expect(NewsController.getCountryName("us")).toBe("United States");

      // Default for unknown code
      expect(NewsController.getCountryName("xx")).toBe("United States");

      // Default for null
      expect(NewsController.getCountryName(null)).toBe("United States");
    });

    test("getLanguageName should handle language codes and names", () => {
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
        { language: "Spanish", code: "es" },
      ]);

      // Already a full name
      expect(NewsController.getLanguageName("French")).toBe("French");

      // Convert code to name
      expect(NewsController.getLanguageName("en")).toBe("English");

      // Default for unknown code
      expect(NewsController.getLanguageName("xx")).toBe("English");

      // Default for null
      expect(NewsController.getLanguageName(null)).toBe("English");
    });
  });

  describe("generateMockNews", () => {
    test("should generate mock news with country and language names", () => {
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
      ]);
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
      ]);

      const result = NewsController.generateMockNews(
        "United States",
        "English",
        "Technology"
      );

      expect(result).toHaveLength(4);
      expect(result[0].title).toContain("Technology");
      expect(result[0].title).toContain("United States");
      expect(result[0].description).toContain("Technology");
      expect(result[0].description).toContain("United States");
      expect(result[0].description).toContain("English");
    });

    test("should handle country and language codes", () => {
      DataLoader.loadCountryData.mockReturnValue([
        { country: "United States", code: "us" },
      ]);
      DataLoader.loadLanguageData.mockReturnValue([
        { language: "English", code: "en" },
      ]);

      const result = NewsController.generateMockNews("us", "en", "Technology");

      expect(result).toHaveLength(4);
      expect(result[0].title).toContain("Technology");
      expect(result[0].title).toContain("United States");
      expect(result[0].country).toBe("us");
      expect(result[0].language).toBe("en");
    });
  });

  describe("generateMockRecommendation", () => {
    test("should generate formatted recommendation with articles", () => {
      const articles = [
        {
          title: "Article 1",
          summary: "Summary 1",
        },
        {
          title: "Article 2",
          description: "Description 2",
        },
        {
          title: "Article 3",
        },
      ];

      const result = NewsController.generateMockRecommendation(
        "United States",
        "English",
        "Technology",
        articles
      );

      expect(result).toContain("# Personalized News Recommendations");
      expect(result).toContain("Technology");
      expect(result).toContain("United States");
      expect(result).toContain("English");
      expect(result).toContain("Article 1");
      expect(result).toContain("Article 2");
      expect(result).toContain("Article 3");
    });

    test("should handle missing input values", () => {
      const articles = [
        {
          title: "Article 1",
        },
      ];

      const result = NewsController.generateMockRecommendation(
        null,
        null,
        null,
        articles
      );

      expect(result).toContain("# Personalized News Recommendations");
      expect(result).toContain("General News");
      expect(result).toContain("United States");
      expect(result).toContain("English");
      expect(result).toContain("Article 1");
    });
  });

  describe("buildMatchingThemePrompt and buildNonMatchingThemePrompt", () => {
    test("buildMatchingThemePrompt should format prompt correctly", () => {
      const articlesData = [
        { index: 0, title: "Article 1" },
        { index: 1, title: "Article 2" },
      ];

      const result = NewsController.buildMatchingThemePrompt(
        "United States",
        "us",
        "English",
        "en",
        "Technology",
        articlesData
      );

      expect(result).toContain("United States");
      expect(result).toContain("English");
      expect(result).toContain("Technology");
      expect(result).toContain(JSON.stringify(articlesData, null, 2));
      expect(result).toContain("# Personalized News Recommendations");
    });

    test("buildNonMatchingThemePrompt should format prompt correctly", () => {
      const articlesData = [
        { index: 0, title: "Article 1" },
        { index: 1, title: "Article 2" },
      ];

      const result = NewsController.buildNonMatchingThemePrompt(
        "United States",
        "us",
        "English",
        "en",
        "Technology",
        articlesData
      );

      expect(result).toContain("United States");
      expect(result).toContain("English");
      expect(result).toContain("Technology");
      expect(result).toContain(JSON.stringify(articlesData, null, 2));
      expect(result).toContain("# Personalized News Recommendations");
      expect(result).toContain("though they may not directly match");
    });
  });
});
