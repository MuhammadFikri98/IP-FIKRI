const request = require("supertest");
const app = require("../app");
const GeminiHelper = require("../helpers/gemini");

// Mock GeminiHelper
jest.mock("../helpers/gemini", () => ({
  generateContent: jest.fn(),
  summarize: jest.fn(),
}));

describe("GeminiController - Complete Coverage", () => {
  let token;

  beforeAll(async () => {
    // Create token for authentication
    const { signToken } = require("../helpers/jwt");
    token = signToken({ id: 1, email: "test@example.com" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generate endpoint", () => {
    test("should generate content successfully", async () => {
      // Mock successful content generation
      GeminiHelper.generateContent.mockResolvedValue("Generated AI content");

      const response = await request(app)
        .post("/gemini/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ prompt: "Test prompt" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "generatedContent",
        "Generated AI content"
      );
      expect(GeminiHelper.generateContent).toHaveBeenCalledWith("Test prompt");
    });

    test("should return 400 if prompt is missing", async () => {
      const response = await request(app)
        .post("/gemini/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Prompt is required");
    });

    test("should handle errors from GeminiHelper", async () => {
      // Mock error from GeminiHelper
      GeminiHelper.generateContent.mockRejectedValue(new Error("AI API error"));

      const response = await request(app)
        .post("/gemini/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ prompt: "Test prompt" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("summarize endpoint", () => {
    test("should summarize text successfully", async () => {
      // Mock successful summarization
      GeminiHelper.summarize.mockResolvedValue("Summarized content");

      const response = await request(app)
        .post("/gemini/summarize")
        .set("Authorization", `Bearer ${token}`)
        .send({ newsText: "Long text to summarize" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("summary", "Summarized content");
      expect(GeminiHelper.summarize).toHaveBeenCalledWith(
        "Long text to summarize"
      );
    });

    test("should return 400 if newsText is missing", async () => {
      const response = await request(app)
        .post("/gemini/summarize")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "News text is required");
    });

    test("should handle errors from GeminiHelper", async () => {
      // Mock error from GeminiHelper
      GeminiHelper.summarize.mockRejectedValue(new Error("AI API error"));

      const response = await request(app)
        .post("/gemini/summarize")
        .set("Authorization", `Bearer ${token}`)
        .send({ newsText: "Long text to summarize" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  test("should require authentication for all endpoints", async () => {
    // Test generate endpoint without token
    const generateResponse = await request(app)
      .post("/gemini/generate")
      .send({ prompt: "Test prompt" });

    expect(generateResponse.status).toBe(401);

    // Test summarize endpoint without token
    const summarizeResponse = await request(app)
      .post("/gemini/summarize")
      .send({ newsText: "Long text to summarize" });

    expect(summarizeResponse.status).toBe(401);
  });
});
