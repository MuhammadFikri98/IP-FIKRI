const { GoogleGenerativeAI } = require("@google/generative-ai");
const GeminiHelper = require("../../helpers/gemini");

// Mock GoogleGenerativeAI and its methods
jest.mock("@google/generative-ai");

describe("GeminiHelper - Complete Coverage Tests", () => {
  let mockGenerateContent;
  let mockModel;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    console.error = jest.fn();

    // Set up mocks for GoogleGenerativeAI and its methods
    mockGenerateContent = jest.fn();
    mockModel = {
      generateContent: mockGenerateContent,
    };

    const mockGetGenerativeModel = jest.fn().mockReturnValue(mockModel);
    GoogleGenerativeAI.prototype.getGenerativeModel = mockGetGenerativeModel;

    // Set environment variable for tests
    process.env.GEMINI_API = "test-api-key";
  });

  afterEach(() => {
    // Restore environment variable
    process.env.GEMINI_API = "test-api-key";
  });

  describe("generateContent", () => {
    test("should generate content with all parameters configured", async () => {
      // Setup successful response
      const mockResponse = {
        response: {
          text: () => "Generated content",
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      // Execute with custom settings
      const result = await GeminiHelper.generateContent("Test prompt", {
        temperature: 0.8,
        maxOutputTokens: 2000,
        topK: 40,
        topP: 0.9,
      });

      // Verify correct result
      expect(result).toBe("Generated content");

      // Verify model was called with custom parameters
      expect(GoogleGenerativeAI).toHaveBeenCalledWith("test-api-key");
      expect(
        GoogleGenerativeAI.prototype.getGenerativeModel
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-1.5-pro",
          generationConfig: expect.objectContaining({
            temperature: 0.8,
            maxOutputTokens: 2000,
            topK: 40,
            topP: 0.9,
          }),
        })
      );
    });

    test("should use default parameters when not specified", async () => {
      // Setup successful response
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "Default content" },
      });

      // Execute with default settings
      await GeminiHelper.generateContent("Test prompt");

      // Verify model was called with default parameters
      expect(
        GoogleGenerativeAI.prototype.getGenerativeModel
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.7,
            maxOutputTokens: 1024,
          }),
        })
      );
    });

    test("should handle missing API key", async () => {
      // Remove API key
      delete process.env.GEMINI_API;

      // Execute
      const result = await GeminiHelper.generateContent("Test prompt");

      // Should return fallback message
      expect(result).toBe(
        "AI recommendations unavailable - API key not configured. Please contact the administrator."
      );

      // Verify GoogleGenerativeAI was not called
      expect(GoogleGenerativeAI).not.toHaveBeenCalled();
    });

    test("should handle API errors gracefully", async () => {
      // Setup API error
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      // Execute
      const result = await GeminiHelper.generateContent("Test prompt");

      // Should return fallback message
      expect(result).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Gemini AI Error:",
        expect.any(Error)
      );
    });

    test("should handle empty or null prompt", async () => {
      // Execute with empty prompt
      const emptyResult = await GeminiHelper.generateContent("");

      // Execute with null prompt
      const nullResult = await GeminiHelper.generateContent(null);

      // Should return fallback message
      expect(emptyResult).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
      expect(nullResult).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );

      // Verify API was not called
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe("summarize", () => {
    test("should summarize text with default parameters", async () => {
      // Setup successful response
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "Summarized content" },
      });

      // Execute
      const result = await GeminiHelper.summarize("Text to summarize");

      // Verify correct result
      expect(result).toBe("Summarized content");

      // Verify prompt contained correct instruction
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("Summarize the following text")
      );
    });

    test("should respect maxLength parameter", async () => {
      // Setup successful response
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "Short summary" },
      });

      // Execute with custom maxLength
      await GeminiHelper.summarize("Text to summarize", 50);

      // Verify prompt contained maxLength instruction
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("in 50 words or less")
      );
    });

    test("should handle summarization errors", async () => {
      // Setup API error
      mockGenerateContent.mockRejectedValue(new Error("Summarization Error"));

      // Execute
      const result = await GeminiHelper.summarize("Text to summarize");

      // Should return original text (fallback)
      expect(result).toBe("Text to summarize");

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Gemini AI Summarization Error:",
        expect.any(Error)
      );
    });

    test("should handle empty or null text", async () => {
      // Execute with empty text
      const emptyResult = await GeminiHelper.summarize("");

      // Execute with null text
      const nullResult = await GeminiHelper.summarize(null);

      // Should return empty string
      expect(emptyResult).toBe("");
      expect(nullResult).toBe("");

      // Verify API was not called
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe("Safety settings and model config", () => {
    test("should include safety settings in model configuration", async () => {
      // Setup successful response
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "Safe content" },
      });

      // Execute
      await GeminiHelper.generateContent("Test prompt");

      // Verify model includes safety settings
      expect(
        GoogleGenerativeAI.prototype.getGenerativeModel
      ).toHaveBeenCalledWith(
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

    test("should handle API response without text method", async () => {
      // Setup malformed response (missing text method)
      mockGenerateContent.mockResolvedValue({
        response: {
          /* No text method */
        },
      });

      // Execute
      const result = await GeminiHelper.generateContent("Test prompt");

      // Should return fallback message
      expect(result).toBe(
        "Unable to generate AI recommendation at this time. Please try again later."
      );
    });
  });
});
