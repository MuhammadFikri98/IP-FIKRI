const request = require("supertest");
const app = require("../../app");
const { User, Collection } = require("../../models");
const { signToken } = require("../../helpers/jwt");
const axios = require("axios");
const NewsController = require("../../controllers/NewsController");

let access_token;
let userId;

// Mock environment variables for testing
process.env.WORLD_NEWS_API_KEY =
  process.env.WORLD_NEWS_API_KEY || "test-api-key";
process.env.GEMINI_API = process.env.GEMINI_API || "test-gemini-key";

// Spy on NewsController helper methods
jest.spyOn(NewsController, "getCountryCode");
jest.spyOn(NewsController, "getLanguageCode");

beforeAll(async () => {
  try {
    // Create a test user for news tests if not exists
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    if (user) {
      userId = user.id;
      access_token = signToken({
        id: user.id,
        email: user.email,
      });
    } else {
      const newUser = await User.create({
        email: "test@mail.com",
        password: "password123",
      });
      userId = newUser.id;
      access_token = signToken({
        id: newUser.id,
        email: newUser.email,
      });
    }

    // Make sure user has at least one collection for personalized news
    const existingCollection = await Collection.findOne({ where: { userId } });
    if (!existingCollection) {
      await Collection.create({
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      });
    }
  } catch (error) {
    console.error("Error in news test setup:", error);
  }
});

// Mock the axios module
jest.mock("axios", () => ({
  get: jest.fn((url) => {
    if (url.includes("empty")) {
      return Promise.resolve({
        status: 200,
        data: {
          news: [],
        },
      });
    } else if (url.includes("error")) {
      return Promise.reject({
        message: "API Error",
        response: {
          status: 400,
          data: { error: "Bad request" },
        },
      });
    }
    return Promise.resolve({
      status: 200,
      data: {
        news: [
          {
            id: "1",
            title: "Test News Article",
            summary: "This is a summary of the test news article",
            text: "This is the full text of the test news article",
            url: "https://example.com/news/1",
            image: "https://example.com/images/1.jpg",
            publish_date: "2025-04-30T12:00:00Z",
            author: "Test Author",
            category: "Technology",
            source_country: "us",
          },
        ],
      },
    });
  }),
}));

// Mock the GeminiHelper
jest.mock("../../helpers/gemini", () => ({
  generateContent: jest.fn(() => Promise.resolve("AI recommendation for test")),
  summarize: jest.fn(() => Promise.resolve("Summarized content for test")),
}));

describe("News API Endpoints", () => {
  describe("GET /news/recommendations", () => {
    test("Should get personalized news recommendations", async () => {
      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("news");
      expect(response.body).toHaveProperty("aiRecommendation");
      expect(response.body).toHaveProperty("userPreferences");

      // Test that helper methods were called
      expect(NewsController.getCountryCode).toHaveBeenCalled();
      expect(NewsController.getLanguageCode).toHaveBeenCalled();
    });

    test("Should handle empty news response", async () => {
      // Set up axios mock to return empty news array
      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: { news: [] },
        })
      );

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body.news).toEqual([]);
      expect(response.body).toHaveProperty(
        "message",
        "No news found for your preferences"
      );
    });

    test("Should handle API errors", async () => {
      // Set up axios mock to throw error
      axios.get.mockImplementationOnce(() =>
        Promise.reject({
          message: "API Error",
          response: {
            status: 500,
            data: { error: "Server error" },
          },
        })
      );

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Error fetching news");
    });

    test("Should handle missing collections", async () => {
      // Temporarily clear collections
      await Collection.destroy({ where: { userId } });

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain(
        "You need to create collections first"
      );

      // Restore a collection for other tests
      await Collection.create({
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      });
    });

    test("Should handle missing collection properties", async () => {
      // Find a collection with full properties
      const fullCollection = await Collection.findOne({ where: { userId } });

      // Temporarily back up the original findAll method
      const originalFindAll = Collection.findAll;

      // Override findAll to return a collection with missing properties
      Collection.findAll = jest.fn().mockResolvedValueOnce([
        {
          id: fullCollection.id,
          userId: userId,
          // Missing country
          language: "English",
          theme: "Technology",
        },
      ]);

      const response = await request(app)
        .get("/news/recommendations")
        .set("Authorization", `Bearer ${access_token}`);

      // Restore original method
      Collection.findAll = originalFindAll;

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain(
        "Your collection is missing required information"
      );
    });

    test("Should fail to get news recommendations without authentication", async () => {
      const response = await request(app).get("/news/recommendations");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid token");
    });
  });

  describe("Helper Methods", () => {
    test("Should get country code from country name", () => {
      const countryCode = NewsController.getCountryCode("United States");
      expect(countryCode).toBeDefined();
    });

    test("Should provide default country code for undefined input", () => {
      const countryCode = NewsController.getCountryCode(undefined);
      expect(countryCode).toBe("us");
    });

    test("Should get language code from language name", () => {
      const languageCode = NewsController.getLanguageCode("English");
      expect(languageCode).toBeDefined();
    });

    test("Should provide default language code for undefined input", () => {
      const languageCode = NewsController.getLanguageCode(undefined);
      expect(languageCode).toBe("en");
    });
  });

  describe("POST /gemini/generate", () => {
    test("Should generate content with Gemini AI", async () => {
      const generateRequest = {
        prompt: "Test prompt for content generation",
      };

      const response = await request(app)
        .post("/gemini/generate")
        .set("Authorization", `Bearer ${access_token}`)
        .send(generateRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("generatedContent");
    });

    test("Should fail to generate content without a prompt", async () => {
      const response = await request(app)
        .post("/gemini/generate")
        .set("Authorization", `Bearer ${access_token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Prompt is required");
    });
  });

  describe("POST /gemini/summarize", () => {
    test("Should summarize news content", async () => {
      const summarizeRequest = {
        newsText:
          "This is a long news article that needs to be summarized. It contains many details about various events and facts that are not necessary for a quick overview.",
      };

      const response = await request(app)
        .post("/gemini/summarize")
        .set("Authorization", `Bearer ${access_token}`)
        .send(summarizeRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("summary");
    });

    test("Should fail to summarize without news text", async () => {
      const response = await request(app)
        .post("/gemini/summarize")
        .set("Authorization", `Bearer ${access_token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "News text is required");
    });
  });
});
