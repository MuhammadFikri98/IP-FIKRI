const NewsController = require("../../controllers/NewsController");
const { Collection } = require("../../models");
const GeminiHelper = require("../../helpers/gemini");
const axios = require("axios");

// Mock required dependencies
jest.mock("../../models");
jest.mock("../../helpers/gemini");
jest.mock("axios");

describe("NewsController - Additional Branch Coverage Tests", () => {
  // Mock response and request objects
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object with authenticated user
    req = {
      user: { id: 15 },
    };

    // Mock response object with jest functions
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock next function
    next = jest.fn();

    // Mock process.env
    process.env.WORLD_NEWS_API_KEY = "test-api-key";
  });

  test("should handle empty news array from API", async () => {
    // Mock Collection.findAll to return collections
    Collection.findAll.mockResolvedValue([
      {
        id: 9,
        userId: 15,
        country: "United States",
        language: "English",
        theme: "Technology",
      },
    ]);

    // Mock axios.get to return empty news array
    axios.get.mockResolvedValue({
      status: 200,
      data: { news: [] },
    });

    // Call the controller method
    await NewsController.getRecommendedNews(req, res, next);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        news: [],
        message: "No news found for your preferences",
      })
    );
  });

  test("should handle invalid API response format", async () => {
    // Mock Collection.findAll to return collections
    Collection.findAll.mockResolvedValue([
      {
        id: 9,
        userId: 15,
        country: "United States",
        language: "English",
        theme: "Technology",
      },
    ]);

    // Mock axios.get to return response without news property
    axios.get.mockResolvedValue({
      status: 200,
      data: { status: "success", results: [] }, // Different structure than expected
    });

    // Call the controller method
    await NewsController.getRecommendedNews(req, res, next);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        news: [],
        message: "No news found for your preferences",
      })
    );
  });

  test("should handle Gemini API failure gracefully", async () => {
    // Mock Collection.findAll to return collections
    Collection.findAll.mockResolvedValue([
      {
        id: 9,
        userId: 15,
        country: "United States",
        language: "English",
        theme: "Technology",
      },
    ]);

    // Mock axios.get to return news
    axios.get.mockResolvedValue({
      status: 200,
      data: {
        news: [
          { title: "Test Article 1", text: "Content 1" },
          { title: "Test Article 2", text: "Content 2" },
        ],
      },
    });

    // Mock GeminiHelper to throw an error
    GeminiHelper.generateContent.mockRejectedValue(new Error("AI API error"));

    // Call the controller method
    await NewsController.getRecommendedNews(req, res, next);

    // Verify response contains news but fallback AI recommendation
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.any(Array),
        aiRecommendation: "Unable to generate AI recommendation at this time.",
      })
    );
  });

  test("should handle collection with missing properties", async () => {
    // Mock Collection.findAll to return a collection without required properties
    Collection.findAll.mockResolvedValue([
      {
        id: 2,
        userId: 15,
        language: "English",
        theme: "Technology",
        // Missing country property
      },
    ]);

    // Call the controller method
    await NewsController.getRecommendedNews(req, res, next);

    // Verify error was passed to next middleware
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "BadRequest",
        message: expect.stringContaining("missing required information"),
      })
    );
  });
});
