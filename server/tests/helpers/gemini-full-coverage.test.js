const GeminiHelper = require("../../helpers/gemini");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Mock GoogleGenerativeAI
jest.mock("@google/generative-ai");

describe("GeminiHelper - Complete Coverage", () => {
  const originalEnv = process.env;

  // Mock generateContent function
  const mockGenerateContentFn = jest.fn();
  const mockModelObject = {
    generateContent: mockGenerateContentFn,
  };

  // Mock model function
  const mockGetGenerativeModel = jest.fn().mockReturnValue(mockModelObject);

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup environment
    process.env = { ...originalEnv };
    process.env.GEMINI_API = "test-api-key";

    // Setup mock returns
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    mockGenerateContentFn.mockResolvedValue({
      response: { text: () => "Generated content" },
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  // GENERATE CONTENT TESTS
  describe("generateContent function", () => {
    test("should generate content with default parameters", async () => {
      const result = await GeminiHelper.generateContent("Test prompt");

      expect(result).toBe("Generated content");
      expect(GoogleGenerativeAI).toHaveBeenCalledWith("test-api-key");
      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-1.5-pro",
        })
      );
      expect(mockGenerateContentFn).toHaveBeenCalledWith("Test prompt");
    });

    test("should throw error when API key is missing", async () => {
      delete process.env.GEMINI_API;

      await expect(async () => {
        await GeminiHelper.generateContent("Test prompt");
      }).rejects.toThrow();
    });

    test("should handle empty prompt", async () => {
      // Empty prompt should not call the API
      const result = await GeminiHelper.generateContent("");

      expect(result).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
      expect(mockGenerateContentFn).not.toHaveBeenCalled();
    });

    test("should handle API errors gracefully", async () => {
      // Simulate API error
      mockGenerateContentFn.mockRejectedValue(new Error("API Error"));

      const result = await GeminiHelper.generateContent("Test prompt");

      expect(result).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
    });

    test("should configure safety settings correctly", async () => {
      await GeminiHelper.generateContent("Test prompt");

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          safetySettings: expect.arrayContaining([
            expect.objectContaining({
              category: expect.any(String),
              threshold: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  // SUMMARIZE TESTS
  describe("summarize function", () => {
    test("should summarize text with default parameters", async () => {
      const result = await GeminiHelper.summarize("Text to summarize");

      expect(result).toBe("Generated content");
      expect(mockGenerateContentFn).toHaveBeenCalledWith(
        expect.stringContaining("Text to summarize")
      );
    });

    test("should respect maxLength parameter", async () => {
      await GeminiHelper.summarize("Text to summarize", 50);

      expect(mockGenerateContentFn).toHaveBeenCalledWith(
        expect.stringContaining("50 words")
      );
    });

    test("should handle empty or null text", async () => {
      const emptyResult = await GeminiHelper.summarize("");
      const nullResult = await GeminiHelper.summarize(null);

      expect(emptyResult).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
      expect(nullResult).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
      expect(mockGenerateContentFn).not.toHaveBeenCalled();
    });

    test("should handle summarization errors", async () => {
      mockGenerateContentFn.mockRejectedValue(new Error("API Error"));

      const result = await GeminiHelper.summarize("Text to summarize");

      expect(result).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
    });
  });
});
