const request = require("supertest");
const app = require("../app");
const { Collection } = require("../models");
const axios = require("axios");
const GeminiHelper = require("../helpers/gemini");
const DataLoader = require("../helpers/dataLoader");

// Mock dependencies
jest.mock("../models");
jest.mock("axios");
jest.mock("../helpers/gemini");
jest.mock("../helpers/dataLoader");

// Mock the authentication middleware at the module level
jest.mock("../middlewares/authentication", () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  });
});

describe("News Controller Endpoints", () => {
  // Mock user for authentication
  const mockUser = { id: 1, email: "test@example.com" };

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for DataLoader
    DataLoader.loadCountryMap.mockReturnValue({
      "United States": "us",
      Japan: "jp",
    });
    DataLoader.loadLanguageMap.mockReturnValue({
      English: "en",
      Japanese: "ja",
    });
    DataLoader.loadCountryData.mockReturnValue([
      { code: "us", country: "United States" },
      { code: "jp", country: "Japan" },
    ]);
    DataLoader.loadLanguageData.mockReturnValue([
      { code: "en", language: "English" },
      { code: "ja", language: "Japanese" },
    ]);
  });

  describe("GET /news/recommendations", () => {
    test("should return/news/recommendations successfully", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Mock axios API response
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: [
            {
              title: "Tech News Article",
              text: "This is a sample tech news article with more than 150 characters to test the substring functionality in the processNewsArticles method. It should be truncated in the description field.",
              url: "https://example.com/tech-news",
              image: "https://example.com/image.jpg",
              publish_date: "2023-07-15T12:00:00Z",
              source: "Tech News Source",
              author: "John Doe",
              sentiment: 0.8,
              categories: ["technology", "innovation"],
            },
          ],
        },
      });

      // Mock Gemini AI recommendation
      GeminiHelper.generateContent.mockResolvedValue(
        "# Personalized News Recommendations\n\nHere are articles selected for your interest in Technology news from United States in English."
      );

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      expect(response.body).toHaveProperty("userPreferences");
      expect(response.body.news).toHaveLength(1);
      expect(response.body.news[0]).toHaveProperty(
        "title",
        "Tech News Article"
      );
      expect(response.body.userPreferences).toEqual({
        country: "United States",
        language: "English",
        theme: "Technology",
      });

      // Verify API call was made with correct parameters
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("api.worldnewsapi.com")
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("language=en")
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("source-countries=us")
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("text=Technology")
      );
    });

    test("should return mock news when API key is not configured", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Save original env and temporarily unset API key
      const originalEnv = process.env.WORLD_NEWS_API_KEY;
      process.env.WORLD_NEWS_API_KEY = "";

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Restore original env
      process.env.WORLD_NEWS_API_KEY = originalEnv;

      // Check response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API key not configured)"
      );
      expect(response.body.news.length).toBeGreaterThan(0);
      expect(response.body.news[0].title).toContain("Technology");
      expect(response.body.news[0].source.name).toBe("NEWS GenAI Demo");

      // Verify API call was not made
      expect(axios.get).not.toHaveBeenCalled();
    });

    test("should return mock data when API returns payment required (402)", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Business",
        },
      ]);

      // Mock axios API error with 402 status
      axios.get.mockRejectedValue({
        response: {
          status: 402,
          data: { message: "Payment required" },
        },
        message: "Request failed with status code 402",
      });

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API requires payment)"
      );
      expect(response.body.news.length).toBeGreaterThan(0);
      expect(response.body.news[0].title).toContain("Business");
    });

    test("should return 400 if user has no collections", async () => {
      // Mock empty collections
      Collection.findAll.mockResolvedValue([]);

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "You need to create collections first to get personalized news recommendations"
      );
    });

    test("should return 400 if collection is missing required fields", async () => {
      // Mock collections with missing fields
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          // missing country
          language: "English",
          theme: "Technology",
        },
      ]);

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Your collection is missing required information (country, language, or theme)"
      );
    });

    test("should return empty news array when API returns no articles", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "Japan",
          language: "Japanese",
          theme: "Anime",
        },
      ]);

      // Mock empty API response
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: [], // No news found
        },
      });

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body.news).toEqual([]);
      expect(response.body).toHaveProperty(
        "message",
        "No news found for your preferences"
      );
      expect(response.body.userPreferences).toEqual({
        country: "Japan",
        language: "Japanese",
        theme: "Anime",
      });
    });

    test("should return 400 for general API errors", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Politics",
        },
      ]);

      // Mock generic API error (not 402)
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
        message: "Request failed with status code 500",
      });

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Error fetching news: Request failed with status code 500"
      );
    });

    test("should use mock recommendation when AI generation fails", async () => {
      // Mock user collections
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
      ]);

      // Mock successful API response
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          news: [
            {
              title: "Tech News Article",
              text: "Sample tech news article",
              url: "https://example.com/tech-news",
              publish_date: "2023-07-15T12:00:00Z",
              source: "Tech News Source",
            },
          ],
        },
        });

      // Mock AI failure
      GeminiHelper.generateContent.mockResolvedValue(
        "Unable to generate content"
      );

      // Execute request
      const response = await request(app).get("/news/recommendations");

      // Check response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      expect(response.body.aiRecommendation).toContain(
        "Personalized News Recommendations"
      );
      expect(response.body.aiRecommendation).toContain(
        "These articles provide comprehensive coverage"
      );
    });

    test("should return 400 if collection is missing theme", async () => {
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "United States",
          language: "English",
        },
      ]);

      const response = await request(app).get("/news/recommendations");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Your collection is missing required information (country, language, or theme)"
      );
    });

    test("should handle errors from the NewsController", async () => {
      Collection.findAll.mockRejectedValue(new Error("Database Error"));

      const response = await request(app).get("/news/recommendations");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  // Test helper methods
  describe("NewsController Helper Methods", () => {
    test("should process news articles correctly", () => {
      // Import NewsController directly to test static methods
      const NewsController = require("../controllers/NewsController");

      const rawArticles = [
        {
          title: "Test Article",
          text: "This is a test article with more than 150 characters to verify the substring functionality works correctly in the processing method.",
          url: "https://example.com/article",
          image: "https://example.com/image.jpg",
          publish_date: "2023-07-15T12:00:00Z",
          source: "Test Source",
        },
        ];

      const processed = NewsController.processNewsArticles(
        rawArticles,
        "us",
        "en",
        "United States"
      );

      expect(processed).toHaveLength(1);
      expect(processed[0]).toHaveProperty("title", "Test Article");
      expect(processed[0]).toHaveProperty(
        "description",
        "This is a test article with more than 150 characters to verify the substring functionality works correctly in the processing method."
      );
      expect(processed[0]).toHaveProperty("country", "us");
      expect(processed[0]).toHaveProperty("language", "en");
    });
  });
}); // Fixed syntax issue by ensuring proper array closure
