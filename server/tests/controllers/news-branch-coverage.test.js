const request = require("supertest");
const app = require("../../app");
const axios = require("axios");
const { Collection } = require("../../models");
const GeminiHelper = require("../../helpers/gemini");
const DataLoader = require("../../helpers/dataLoader");

// Mock dependencies
jest.mock("axios");
jest.mock("../../models");
jest.mock("../../helpers/gemini");
jest.mock("../../helpers/dataLoader");

describe("NewsController - Complete Branch Coverage", () => {
  let token;
  let userId;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup test user and token
    userId = 999;
    process.env.JWT_SECRET = "test-secret";
    token = require("../../helpers/jwt").signToken({
      id: userId,
      email: "test@example.com",
    });

    // Setup process environment
    process.env.WORLD_NEWS_API_KEY = "test-api-key";

    // Default mock implementations
    Collection.findAll.mockResolvedValue([]);
    axios.get.mockResolvedValue({ data: { news: [] }, status: 200 });
    GeminiHelper.generateContent.mockResolvedValue(
      "AI generated recommendation"
    );

    // Mock DataLoader
    DataLoader.loadCountryMap.mockReturnValue({
      "United States": "us",
      Germany: "de",
      Japan: "jp",
      "United Kingdom": "gb",
    });

    DataLoader.loadLanguageMap.mockReturnValue({
      English: "en",
      German: "de",
      Japanese: "ja",
      Spanish: "es",
    });

    DataLoader.loadCountryData.mockReturnValue([
      { country: "United States", code: "us" },
      { country: "Germany", code: "de" },
    ]);

    DataLoader.loadLanguageData.mockReturnValue([
      { language: "English", code: "en" },
      { language: "German", code: "de" },
    ]);
  });

  afterEach(() => {
    delete process.env.WORLD_NEWS_API_KEY;
  });

  describe("GET /news/recommendations - getRecommendedNews", () => {
    test("should handle no collections case", async () => {
      Collection.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "You need to create collections first to get personalized news recommendations"
      );
    });

    test("should handle missing collection properties", async () => {
      // Collection missing country, should fail validation
      const invalidCollection = {
        id: 1,
        userId,
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([invalidCollection]);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Your collection is missing required information (country, language, or theme)"
      );
    });

    test("should handle no API key configured", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Delete API key
      delete process.env.WORLD_NEWS_API_KEY;

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Should return mock data with message
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API key not configured)"
      );
      expect(response.body).toHaveProperty("news");
      expect(Array.isArray(response.body.news)).toBe(true);
    });

    test("should handle empty news array from API", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // API returns empty array
      axios.get.mockResolvedValue({
        status: 200,
        data: { news: [] },
      });

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news", []);
      expect(response.body).toHaveProperty(
        "message",
        "No news found for your preferences"
      );
    });

    test("should handle normal API response with news", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock API response with articles
      const mockArticles = [
        {
          title: "Tech News 1",
          text: "This is a test article about technology",
          summary: "Tech news summary",
          url: "https://example.com/tech1",
          publish_date: "2025-05-01",
          source: "Tech News",
          image: "https://example.com/image1.jpg",
        },
        {
          title: "Tech News 2",
          text: "Another test article about technology",
          summary: "More tech news",
          url: "https://example.com/tech2",
          publish_date: "2025-05-01",
        },
      ];

      axios.get.mockResolvedValue({
        status: 200,
        data: { news: mockArticles },
      });

      // Mock AI recommendation
      GeminiHelper.generateContent.mockResolvedValue(
        "AI recommendation for technology news"
      );

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body.news.length).toBe(2);
      expect(response.body).toHaveProperty(
        "aiRecommendation",
        "AI recommendation for technology news"
      );
    });

    test("should handle payment required API error (402)", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock 402 Payment Required error
      const error402 = new Error("Payment required");
      error402.response = {
        status: 402,
        data: { error: "Payment required for this endpoint" },
      };

      axios.get.mockRejectedValue(error402);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Should return mock data with payment required message
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API requires payment)"
      );
      expect(response.body).toHaveProperty("news");
      expect(Array.isArray(response.body.news)).toBe(true);
    });

    test("should handle general API error", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock general API error
      const error500 = new Error("Server error");
      error500.response = {
        status: 500,
        data: { error: "Internal server error" },
      };

      axios.get.mockRejectedValue(error500);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Error fetching news: Server error"
      );
    });

    test("should handle API error without response object", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock network error without response
      const networkError = new Error("Network error");
      networkError.request = {}; // Has request but no response

      axios.get.mockRejectedValue(networkError);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Error fetching news: Network error"
      );
    });

    test("should handle AI generation failure", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock API response with articles
      const mockArticles = [
        {
          title: "Tech News 1",
          text: "This is a test article about technology",
          summary: "Tech news summary",
          url: "https://example.com/tech1",
          publish_date: "2025-05-01",
        },
      ];

      axios.get.mockResolvedValue({
        status: 200,
        data: { news: mockArticles },
      });

      // First AI call fails, then second also fails
      GeminiHelper.generateContent
        .mockResolvedValueOnce(
          "Unable to generate AI recommendation at this time"
        )
        .mockResolvedValueOnce(
          "Unable to generate AI recommendation at this time"
        );

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      // Should fall back to mock recommendation
      expect(response.body.aiRecommendation).toContain(
        "Personalized News Recommendations"
      );
    });

    test("should handle failed retries with simpler prompt", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock API response with articles
      const mockArticles = [
        {
          title: "Tech News 1",
          text: "This is a test article about technology",
          summary: "Tech news summary",
          url: "https://example.com/tech1",
          publish_date: "2025-05-01",
        },
      ];

      axios.get.mockResolvedValue({
        status: 200,
        data: { news: mockArticles },
      });

      // First AI call fails with complex prompt, second call succeeds with simple prompt
      GeminiHelper.generateContent
        .mockResolvedValueOnce(
          "Unable to generate AI recommendation at this time"
        )
        .mockResolvedValueOnce(
          "Here are 3 recommended articles about Technology"
        );

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "aiRecommendation",
        "Here are 3 recommended articles about Technology"
      );
    });

    test("should handle AI error by using mock recommendation", async () => {
      // Valid collection
      const validCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findAll.mockResolvedValue([validCollection]);

      // Mock API response with articles
      const mockArticles = [
        {
          title: "Tech News 1",
          text: "This is a test article about technology",
          summary: "Tech news summary",
          url: "https://example.com/tech1",
          publish_date: "2025-05-01",
        },
      ];

      axios.get.mockResolvedValue({
        status: 200,
        data: { news: mockArticles },
      });

      // AI calls throw error
      GeminiHelper.generateContent.mockRejectedValue(new Error("AI API error"));

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      // Should fall back to mock recommendation
      expect(response.body.aiRecommendation).toContain(
        "Personalized News Recommendations"
      );
    });
  });

  describe("buildNewsApiUrl", () => {
    const NewsController = require("../../controllers/NewsController");

    test("should build URL with all basic parameters", () => {
      const url = NewsController.buildNewsApiUrl(
        "test-key",
        "us",
        "en",
        "Technology"
      );

      expect(url).toContain("api.worldnewsapi.com/search-news");
      expect(url).toContain("api-key=test-key");
      expect(url).toContain("language=en");
      expect(url).toContain("source-countries=us");
      expect(url).toContain("text=Technology");
      expect(url).toContain("sort=publish-time");
      expect(url).toContain("sort-direction=desc");
    });

    test("should use different date range for business topics", () => {
      const busUrl = NewsController.buildNewsApiUrl(
        "test-key",
        "us",
        "en",
        "Business"
      );
      const techUrl = NewsController.buildNewsApiUrl(
        "test-key",
        "us",
        "en",
        "Technology"
      );

      // Business should look back 7 days
      expect(busUrl).toContain("earliest-publish-date=");

      // Non-business topics should look back 3 days
      expect(techUrl).toContain("earliest-publish-date=");

      // Different date parameters
      expect(busUrl).not.toEqual(techUrl);
    });
  });

  describe("processNewsArticles", () => {
    const NewsController = require("../../controllers/NewsController");

    test("should process articles with complete information", () => {
      const articles = [
        {
          title: "Test Article",
          text: "This is a long text that should be truncated in the description field.",
          summary: "Article summary",
          url: "https://example.com",
          image: "https://example.com/image.jpg",
          publish_date: "2025-05-01",
          source: "Test Source",
          source_country: "United States",
          author: "Test Author",
          sentiment: 0.8,
          categories: ["technology", "science"],
        },
      ];

      const processed = NewsController.processNewsArticles(
        articles,
        "us",
        "en",
        "United States"
      );

      expect(processed.length).toBe(1);
      expect(processed[0]).toHaveProperty("title", "Test Article");
      expect(processed[0]).toHaveProperty("description");
      expect(processed[0]).toHaveProperty("url", "https://example.com");
      expect(processed[0]).toHaveProperty(
        "urlToImage",
        "https://example.com/image.jpg"
      );
      expect(processed[0]).toHaveProperty("publishedAt", "2025-05-01");
      expect(processed[0]).toHaveProperty("source.name", "United States");
      expect(processed[0]).toHaveProperty("country", "us");
      expect(processed[0]).toHaveProperty("language", "en");
      expect(processed[0]).toHaveProperty("summary", "Article summary");
      expect(processed[0]).toHaveProperty("author", "Test Author");
      expect(processed[0]).toHaveProperty("sentiment", 0.8);
      expect(processed[0]).toHaveProperty("categories", [
        "technology",
        "science",
      ]);
    });

    test("should handle missing fields", () => {
      const articles = [
        {
          title: "Test Article",
          // Missing many fields
        },
      ];

      const processed = NewsController.processNewsArticles(
        articles,
        "us",
        "en",
        "United States"
      );

      expect(processed.length).toBe(1);
      expect(processed[0]).toHaveProperty("title", "Test Article");
      expect(processed[0]).toHaveProperty("description", "");
      expect(processed[0]).toHaveProperty("urlToImage");
      expect(processed[0].urlToImage).toContain("placeholder");
      expect(processed[0]).toHaveProperty("source.name", "United States");
    });
  });

  describe("generateAIRecommendation", () => {
    const NewsController = require("../../controllers/NewsController");

    test("should identify theme-relevant articles", async () => {
      const articles = [
        {
          title: "Technology Update: New Devices",
          summary: "Latest technology news about devices",
          country: "us",
          language: "en",
        },
      ];

      // Spy on the buildMatchingThemePrompt and buildNonMatchingThemePrompt
      const spyMatching = jest.spyOn(
        NewsController,
        "buildMatchingThemePrompt"
      );
      const spyNonMatching = jest.spyOn(
        NewsController,
        "buildNonMatchingThemePrompt"
      );

      // Mock GeminiHelper.generateContent to return successful response
      GeminiHelper.generateContent.mockResolvedValue("AI recommendation");

      await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en"
      );

      // Should call the matching theme prompt since "Technology" is in the title
      expect(spyMatching).toHaveBeenCalled();
      expect(spyNonMatching).not.toHaveBeenCalled();

      // Clean up
      spyMatching.mockRestore();
      spyNonMatching.mockRestore();
    });

    test("should handle non-matching themes", async () => {
      const articles = [
        {
          title: "Sports Update: Latest Scores",
          summary: "Latest sports news",
          country: "us",
          language: "en",
        },
      ];

      // Spy on the buildMatchingThemePrompt and buildNonMatchingThemePrompt
      const spyMatching = jest.spyOn(
        NewsController,
        "buildMatchingThemePrompt"
      );
      const spyNonMatching = jest.spyOn(
        NewsController,
        "buildNonMatchingThemePrompt"
      );

      // Mock GeminiHelper.generateContent to return successful response
      GeminiHelper.generateContent.mockResolvedValue("AI recommendation");

      await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology", // Theme doesn't match articles
        "us",
        "en"
      );

      // Should call the non-matching theme prompt
      expect(spyMatching).not.toHaveBeenCalled();
      expect(spyNonMatching).toHaveBeenCalled();

      // Clean up
      spyMatching.mockRestore();
      spyNonMatching.mockRestore();
    });

    test("should use mock data when specified", async () => {
      const articles = [
        {
          title: "Technology Update",
          summary: "Tech news",
          country: "us",
          language: "en",
        },
      ];

      // Spy on the mock recommendation function
      const spyMock = jest.spyOn(NewsController, "generateMockRecommendation");

      // Force using mock data
      await NewsController.generateAIRecommendation(
        articles,
        "United States",
        "English",
        "Technology",
        "us",
        "en",
        true // Use mock data
      );

      // Should call the mock recommendation function directly
      expect(spyMock).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).not.toHaveBeenCalled();

      // Clean up
      spyMock.mockRestore();
    });
  });

  describe("Helper methods", () => {
    const NewsController = require("../../controllers/NewsController");

    test("getCountryCode should handle country names", () => {
      expect(NewsController.getCountryCode("United States")).toBe("us");
      expect(NewsController.getCountryCode("Germany")).toBe("de");
      expect(NewsController.getCountryCode("NonExistent")).toBe("us"); // Default
      expect(NewsController.getCountryCode()).toBe("us"); // Default for undefined
    });

    test("getLanguageCode should handle language names", () => {
      expect(NewsController.getLanguageCode("English")).toBe("en");
      expect(NewsController.getLanguageCode("German")).toBe("de");
      expect(NewsController.getLanguageCode("NonExistent")).toBe("en"); // Default
      expect(NewsController.getLanguageCode()).toBe("en"); // Default for undefined
    });

    test("getCountryName should handle country codes", () => {
      expect(NewsController.getCountryName("us")).toBe("United States");
      expect(NewsController.getCountryName("de")).toBe("Germany");
      expect(NewsController.getCountryName("xx")).toBe("United States"); // Default
      expect(NewsController.getCountryName()).toBe("United States"); // Default for undefined

      // Already a full name
      expect(NewsController.getCountryName("Germany")).toBe("Germany");
    });

    test("getLanguageName should handle language codes", () => {
      expect(NewsController.getLanguageName("en")).toBe("English");
      expect(NewsController.getLanguageName("de")).toBe("German");
      expect(NewsController.getLanguageName("xx")).toBe("English"); // Default
      expect(NewsController.getLanguageName()).toBe("English"); // Default for undefined

      // Already a full name
      expect(NewsController.getLanguageName("German")).toBe("German");
    });

    test("getCountryName should handle errors", () => {
      // Force error
      DataLoader.loadCountryData.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      expect(NewsController.getCountryName("de")).toBe("United States"); // Default on error
    });

    test("getLanguageName should handle errors", () => {
      // Force error
      DataLoader.loadLanguageData.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      expect(NewsController.getLanguageName("en")).toBe("English"); // Default on error
    });
  });
});
