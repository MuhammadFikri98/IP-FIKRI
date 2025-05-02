const request = require("supertest");
const app = require("../app");
const GeminiHelper = require("../helpers/gemini");

// Mock dependencies
jest.mock("../helpers/gemini");

// Mock the authentication middleware
jest.mock("../middlewares/authentication", () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  });
});

describe("Gemini Controller Endpoints", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /generate-content", () => {
    test("should generate content successfully", async () => {
      // Mock successful content generation
      const mockResponse = "This is AI generated content based on your prompt";
      GeminiHelper.generateContent.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/generate-content")
        .send({ prompt: "Write a short story about AI" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("generatedContent", mockResponse);
      expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
        "Write a short story about AI"
      );
    });

    test("should return 400 if prompt is missing", async () => {
      const response = await request(app).post("/generate-content").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Prompt is required");
      expect(GeminiHelper.generateContent).not.toHaveBeenCalled();
    });

    test("should return 400 if prompt is empty", async () => {
      const response = await request(app)
        .post("/generate-content")
        .send({ prompt: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Prompt is required");
      expect(GeminiHelper.generateContent).not.toHaveBeenCalled();
    });

    test("should handle error from Gemini API", async () => {
      // Mock API error
      GeminiHelper.generateContent.mockRejectedValue(
        new Error("API quota exceeded")
      );

      const response = await request(app)
        .post("/generate-content")
        .send({ prompt: "Write something" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
        "Write something"
      );
    });
  });

  describe("POST /summarize-news", () => {
    test("should summarize news successfully", async () => {
      // Mock successful summarization
      const mockSummary = "This is a summary of the news article.";
      GeminiHelper.summarize.mockResolvedValue(mockSummary);

      const longNewsText =
        "This is a very long news article with multiple paragraphs and detailed information about various events that happened recently. The article covers several topics and provides in-depth analysis of each situation.";

      const response = await request(app)
        .post("/summarize-news")
        .send({ newsText: longNewsText });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("summary", mockSummary);
      expect(GeminiHelper.summarize).toHaveBeenCalledWith(longNewsText);
    });

    test("should return 400 if news text is missing", async () => {
      const response = await request(app).post("/summarize-news").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "News text is required");
      expect(GeminiHelper.summarize).not.toHaveBeenCalled();
    });

    test("should return 400 if news text is empty", async () => {
      const response = await request(app)
        .post("/summarize-news")
        .send({ newsText: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "News text is required");
      expect(GeminiHelper.summarize).not.toHaveBeenCalled();
    });

    test("should handle error from Gemini API during summarization", async () => {
      // Mock API error
      GeminiHelper.summarize.mockRejectedValue(
        new Error("Content filtered by safety settings")
      );

      const response = await request(app)
        .post("/summarize-news")
        .send({ newsText: "Some news content that triggers a safety filter" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(GeminiHelper.summarize).toHaveBeenCalled();
    });

    test("should handle very long news text", async () => {
      // Mock successful summarization with long text
      const mockSummary = "Summary of very long article";
      GeminiHelper.summarize.mockResolvedValue(mockSummary);

      // Create a very long string
      const veryLongText = "A".repeat(10000);

      const response = await request(app)
        .post("/summarize-news")
        .send({ newsText: veryLongText });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("summary", mockSummary);
      expect(GeminiHelper.summarize).toHaveBeenCalledWith(veryLongText);
    });
  });

  describe("POST /gemini/generate", () => {
    test("should return 400 if prompt is missing", async () => {
      const response = await request(app).post("/gemini/generate").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Prompt is required");
    });

    test("should handle errors from GeminiHelper", async () => {
      GeminiHelper.generateContent.mockRejectedValue(new Error("API Error"));

      const response = await request(app)
        .post("/gemini/generate")
        .send({ prompt: "Test prompt" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /gemini/summarize", () => {
    test("should return 400 if newsText is missing", async () => {
      const response = await request(app).post("/gemini/summarize").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "News text is required");
    });

    test("should handle errors from GeminiHelper", async () => {
      GeminiHelper.summarize.mockRejectedValue(new Error("API Error"));

      const response = await request(app)
        .post("/gemini/summarize")
        .send({ newsText: "Test news text" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });
});
