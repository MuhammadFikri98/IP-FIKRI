const GeminiHelper = require("../../helpers/gemini");
const fetch = require("node-fetch");

jest.mock("node-fetch");

describe("GeminiHelper - Extended Branch Coverage Tests", () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset environment for each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test("should handle missing API key", async () => {
    // Remove API key from environment
    delete process.env.GEMINI_API;

    // Test behavior when API key is missing
    await expect(async () => {
      await GeminiHelper.generateContent("Test prompt");
    }).rejects.toMatchObject({
      name: "BadRequest",
      message: "Gemini API key is not configured",
    });
  });

  test("should handle different model configurations", async () => {
    // Mock API key
    process.env.GEMINI_API = "fake-api-key";

    // Mock response for successful API call
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue("Generated content"),
    };

    // Mock fetch to return success
    fetch.mockResolvedValue(mockResponse);

    // Call with custom configuration
    const result = await GeminiHelper.generateContent("Test prompt", {
      temperature: 0.5,
      maxOutputTokens: 2000,
    });

    // Verify result
    expect(result).toBe("Generated content");

    // Verify fetch was called with custom config (check parameters contain our custom values)
    const fetchCall = fetch.mock.calls[0][1];
    const body = JSON.parse(fetchCall.body);
    expect(body.generationConfig.temperature).toBe(0.5);
    expect(body.generationConfig.maxOutputTokens).toBe(2000);
  });

  test("should handle API errors and convert them to BadRequest errors", async () => {
    // Set API key
    process.env.GEMINI_API = "fake-api-key";

    // Prepare error message
    const errorMessage = "API quota exceeded";

    // Mock fetch to throw an error
    fetch.mockRejectedValue(new Error(errorMessage));

    // Test that the error is properly handled and converted
    await expect(async () => {
      await GeminiHelper.generateContent("Test prompt");
    }).rejects.toMatchObject({
      name: "BadRequest",
      message: expect.stringContaining(errorMessage),
    });
  });

  test("should call generateContent with proper parameters in summarize", async () => {
    // Mock generateContent method
    const originalGenerateContent = GeminiHelper.generateContent;
    GeminiHelper.generateContent = jest
      .fn()
      .mockResolvedValue("Summarized content");

    // Call summarize method
    const text = "This is a long text that needs to be summarized";
    const maxLength = 300;

    await GeminiHelper.summarize(text, maxLength);

    // Verify generateContent was called with correct parameters
    expect(GeminiHelper.generateContent).toHaveBeenCalledWith(
      expect.stringContaining(text),
      expect.objectContaining({
        maxOutputTokens: maxLength,
      })
    );

    // Restore original method
    GeminiHelper.generateContent = originalGenerateContent;
  });
});
