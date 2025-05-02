const GeminiHelper = require("../../helpers/gemini");

// Mock the environment before testing
const originalEnv = process.env;

jest.mock("@google/generative-ai", () => {
  // Create mock implementations
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => "Generated content",
    },
  });

  const mockFallbackGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => "Fallback content",
    },
  });

  // Expose mocks to tests so they can be modified
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn((config) => {
          if (config.model === "gemini-pro") {
            return {
              generateContent: mockFallbackGenerateContent,
            };
          }
          return {
            generateContent: mockGenerateContent,
          };
        }),
      };
    }),
    mockGenerateContent,
    mockFallbackGenerateContent,
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
      HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
      HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    },
    HarmBlockThreshold: {
      BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
    },
  };
});

describe("GeminiHelper", () => {
  // Save original environment and restore after each test
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("should return generated content", async () => {
    // Make sure API key is set for this test
    process.env.GEMINI_API = "test-api-key";

    const result = await GeminiHelper.generateContent("Test prompt");
    expect(result).toBe("Generated content");
  });

  test("should handle missing API key", async () => {
    // Explicitly delete the API key
    delete process.env.GEMINI_API;

    const result = await GeminiHelper.generateContent("Test prompt");
    expect(result).toBe(
      "AI recommendations unavailable - API key not configured. Please contact the administrator."
    );
  });

  test("should handle errors during content generation", async () => {
    // Mock the specific error scenario
    const generateAIMock = require("@google/generative-ai");
    const mockModel = {
      generateContent: jest.fn().mockRejectedValue(new Error("API Error")),
    };

    // Override the mock implementation for this test
    generateAIMock.GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    }));

    const result = await GeminiHelper.generateContent("Test prompt");
    expect(result).toBe(
      "Unable to generate AI recommendation at this time. Please try again later."
    );
  });

  test("should handle fallback to gemini-pro model", async () => {
    const generateAIMock = require("@google/generative-ai");

    // Create initial model that will throw an error
    const mockModel = {
      generateContent: jest
        .fn()
        .mockRejectedValue(new Error("Model not available")),
    };

    // Create fallback model that will succeed
    const mockFallbackModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => "Fallback content" },
      }),
    };

    // Mock implementation that returns different models based on config
    generateAIMock.GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn((config) => {
        if (config.model === "gemini-pro") {
          return mockFallbackModel;
        }
        return mockModel;
      }),
    }));

    const result = await GeminiHelper.generateContent("Test prompt");
    expect(result).toBe("Fallback content");
  });

  test("should handle all errors in generation process", async () => {
    // Mock the API call failure for both models
    const generateAIMock = require("@google/generative-ai");
    const mockModel = {
      generateContent: jest
        .fn()
        .mockRejectedValue(new Error("Primary model error")),
    };

    const mockFallbackModel = {
      generateContent: jest
        .fn()
        .mockRejectedValue(new Error("Fallback model error")),
    };

    // Make both the main model and fallback model fail
    generateAIMock.GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn((config) => {
        if (config.model === "gemini-pro") {
          return mockFallbackModel;
        }
        return mockModel;
      }),
    }));

    const result = await GeminiHelper.generateContent("Test prompt");
    expect(result).toBe(
      "Unable to generate AI recommendation at this time. Please try again later."
    );
  });

  test("should successfully summarize text", async () => {
    // Spy on the generateContent method
    jest
      .spyOn(GeminiHelper, "generateContent")
      .mockResolvedValue("Summarized content");

    const result = await GeminiHelper.summarize("Long text to summarize");
    expect(result).toBe("Summarized content");

    // Check that generateContent was called with correct parameters
    expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
      expect.stringContaining("summarize the following text"),
      expect.objectContaining({
        temperature: 0.2,
        maxOutputTokens: 512,
      })
    );
  });
});
