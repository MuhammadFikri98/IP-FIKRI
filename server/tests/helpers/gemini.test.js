const GeminiHelper = require("../../helpers/gemini");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Mock Google Generative AI
jest.mock("@google/generative-ai");

describe("GeminiHelper - Branch Coverage Tests", () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.GEMINI_API;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env.GEMINI_API = originalEnv;
  });

  // Test missing API key
  test("should throw error when API key is missing", async () => {
    // Clear API key
    delete process.env.GEMINI_API;

    await expect(
      GeminiHelper.generateContent("Test prompt")
    ).rejects.toMatchObject({
      name: "BadRequest",
      message: "Gemini API key is not configured",
    });
  });

  // Test successful content generation with default config
  test("should generate content with default config", async () => {
    // Set API key
    process.env.GEMINI_API = "test-api-key";

    // Mock the generative model
    const mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue("Generated content"),
        },
      }),
    };

    // Mock the Google API
    const mockGetGenerativeModel = jest.fn().mockReturnValue(mockModel);
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    const result = await GeminiHelper.generateContent("Test prompt");

    // Verify result
    expect(result).toBe("Generated content");

    // Verify model was called with default settings
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-1.5-pro",
        generationConfig: expect.objectContaining({
          temperature: 0.9,
          maxOutputTokens: 1024,
        }),
      })
    );
  });

  // Test custom configuration
  test("should use custom config when provided", async () => {
    // Set API key
    process.env.GEMINI_API = "test-api-key";

    // Custom config
    const customConfig = {
      temperature: 0.5,
      maxOutputTokens: 2048,
    };

    // Mock the generative model
    const mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue("Generated with custom config"),
        },
      }),
    };

    // Mock the Google API
    const mockGetGenerativeModel = jest.fn().mockReturnValue(mockModel);
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    const result = await GeminiHelper.generateContent(
      "Test prompt",
      customConfig
    );

    // Verify result
    expect(result).toBe("Generated with custom config");

    // Verify model was called with custom settings
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          temperature: 0.5,
          maxOutputTokens: 2048,
        }),
      })
    );
  });

  // Test API error handling
  test("should handle API errors gracefully", async () => {
    // Set API key
    process.env.GEMINI_API = "test-api-key";

    // Mock API error
    const mockError = new Error("API quota exceeded");
    GoogleGenerativeAI.mockImplementation(() => {
      throw mockError;
    });

    await expect(
      GeminiHelper.generateContent("Test prompt")
    ).rejects.toMatchObject({
      name: "BadRequest",
      message: expect.stringContaining("API quota exceeded"),
    });
  });

  // Test summarize method
  test("should summarize text with appropriate config", async () => {
    // Set API key
    process.env.GEMINI_API = "test-api-key";

    // Spy on generateContent method
    jest
      .spyOn(GeminiHelper, "generateContent")
      .mockResolvedValue("Summarized text");

    const result = await GeminiHelper.summarize("Long text to summarize");

    // Verify result
    expect(result).toBe("Summarized text");

    // Verify generateContent was called with correct params
    expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
      expect.stringContaining("Long text to summarize"),
      expect.objectContaining({
        temperature: 0.2,
        maxOutputTokens: 512,
      })
    );

    // Restore the original method
    GeminiHelper.generateContent.mockRestore();
  });

  // Test custom summary length
  test("should respect custom maxLength for summary", async () => {
    // Set API key
    process.env.GEMINI_API = "test-api-key";

    // Spy on generateContent method
    jest
      .spyOn(GeminiHelper, "generateContent")
      .mockResolvedValue("Custom length summary");

    const result = await GeminiHelper.summarize("Text to summarize", 200);

    // Verify generateContent was called with custom maxOutputTokens
    expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        maxOutputTokens: 200,
      })
    );

    // Restore the original method
    GeminiHelper.generateContent.mockRestore();
  });
});
