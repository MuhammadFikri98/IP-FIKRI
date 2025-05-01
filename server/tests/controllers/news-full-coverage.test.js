const request = require("supertest");
const app = require("../../app");
const NewsController = require("../../controllers/NewsController");
const { Collection } = require("../../models");
const axios = require("axios");
const GeminiHelper = require("../../helpers/gemini");

// Mock dependencies
jest.mock("axios");
jest.mock("../../models");
jest.mock("../../helpers/gemini");

describe("NewsController - Full Coverage", () => {
  let token;

  beforeAll(async () => {
    // Create token for authentication
    const { signToken } = require("../../helpers/jwt");
    token = signToken({ id: 1, email: "test@example.com" });
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up defaults
    process.env.WORLDNEWS_API = "test-api-key";
  });

  afterEach(() => {
    // Reset environment
    delete process.env.WORLDNEWS_API;
  });

  describe("getRecommendedNews", () => {
    test("should return personalized news when everything works correctly", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock
      const mockNewsResponse = {
        data: {
          news: [
            { title: "Tech News 1", content: "Content 1" },
            { title: "Tech News 2", content: "Content 2" },
          ],
        },
      };
      axios.get.mockResolvedValue(mockNewsResponse);

      // Setup Gemini mock
      GeminiHelper.generateContent.mockResolvedValue("AI recommended content");

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty(
        "aiRecommendation",
        "AI recommended content"
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).toHaveBeenCalled();
    });

    test("should handle no collections found", async () => {
      // Setup Collection mock to return empty array
      Collection.findAll.mockResolvedValue([]);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "You need to create collections first to get personalized news recommendations"
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).not.toHaveBeenCalled();
    });

    test("should handle collection with missing properties", async () => {
      // Setup Collection mock with incomplete data
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          // Missing country, language or theme
        },
      ]);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Your collection is missing required information (country, language, or theme)"
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).not.toHaveBeenCalled();
    });

    test("should handle missing API key", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Remove API key
      delete process.env.WORLDNEWS_API;

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API key not configured)"
      );
      expect(response.body).toHaveProperty("news");
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).not.toHaveBeenCalled();
    });

    test("should handle empty news array from API", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock with empty news array
      const mockNewsResponse = {
        data: {
          news: [],
        },
      };
      axios.get.mockResolvedValue(mockNewsResponse);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news", []);
      expect(response.body).toHaveProperty(
        "message",
        "No news found for your preferences"
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).not.toHaveBeenCalled();
    });

    test("should handle API payment required error (402)", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock with 402 error
      const mockError = {
        response: {
          status: 402,
          data: {
            message: "Payment required",
          },
        },
      };
      axios.get.mockRejectedValue(mockError);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Using demo data (API requires payment)"
      );
      expect(response.body).toHaveProperty("news");
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
    });

    test("should handle general API error", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock with general error
      const mockError = {
        response: {
          status: 500,
          data: {
            message: "Server error",
          },
        },
      };
      axios.get.mockRejectedValue(mockError);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Error fetching news: Server error"
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
    });

    test("should handle API error without response object", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock with network error
      const mockError = new Error("Network error");
      axios.get.mockRejectedValue(mockError);

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Error fetching news")
      );
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
    });

    test("should handle AI generation failure and use fallback", async () => {
      // Setup Collection mock
      Collection.findAll.mockResolvedValue([
        {
          userId: 1,
          country: "us",
          language: "en",
          theme: "Technology",
        },
      ]);

      // Setup axios mock
      const mockNewsResponse = {
        data: {
          news: [
            { title: "Tech News 1", content: "Content 1" },
            { title: "Tech News 2", content: "Content 2" },
          ],
        },
      };
      axios.get.mockResolvedValue(mockNewsResponse);

      // Setup Gemini mock to fail
      GeminiHelper.generateContent.mockRejectedValue(new Error("AI API error"));

      // Make request
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${token}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      // Should have a fallback recommendation
      expect(response.body.aiRecommendation).toContain("Technology");
      expect(Collection.findAll).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalled();
      expect(GeminiHelper.generateContent).toHaveBeenCalled();
    });
  });

  describe("Helper functions", () => {
    test("getCountryCode should handle country names", () => {
      expect(NewsController.getCountryCode("United States")).toBe("us");
      expect(NewsController.getCountryCode("Germany")).toBe("de");
      expect(NewsController.getCountryCode("Non-existent")).toBe("us"); // Default fallback
    });

    test("getLanguageCode should handle language names", () => {
      expect(NewsController.getLanguageCode("English")).toBe("en");
      expect(NewsController.getLanguageCode("Spanish")).toBe("es");
      expect(NewsController.getLanguageCode("Non-existent")).toBe("en"); // Default fallback
    });

    test("processNewsArticles should handle missing fields", () => {
      const articles = [
        { title: "News 1" }, // Missing many fields
        { title: "News 2", description: "Desc 2" }, // Missing some fields
        { title: "News 3", description: "Desc 3", url: "http://example.com" }, // More complete
      ];

      const processed = NewsController.processNewsArticles(
        articles,
        "us",
        "en"
      );

      expect(processed).toHaveLength(3);
      expect(processed[0]).toHaveProperty("title", "News 1");
      expect(processed[0]).toHaveProperty("country", "us");
      expect(processed[0]).toHaveProperty("language", "en");
      expect(processed[0]).toHaveProperty("urlToImage"); // Should have default image URL
    });
  });
});
