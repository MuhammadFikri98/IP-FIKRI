const GeminiController = require("../../controllers/GeminiController");
const GeminiHelper = require("../../helpers/gemini");

// Mock the GeminiHelper
jest.mock("../../helpers/gemini");

describe("GeminiController", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if prompt is missing in generateContent", async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await GeminiController.generateContent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Prompt is required" });
  });

  test("should return 400 if newsText is missing in summarizeNews", async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await GeminiController.summarizeNews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "News text is required" });
  });

  test("should handle errors in generateContent", async () => {
    const req = { body: { prompt: "Test prompt" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    GeminiHelper.generateContent.mockRejectedValue(new Error("API Error"));

    await GeminiController.generateContent(req, res, next);

    expect(next).toHaveBeenCalledWith(new Error("API Error"));
  });

  test("should handle errors in summarizeNews", async () => {
    const req = { body: { newsText: "Test news text" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    GeminiHelper.summarize.mockRejectedValue(new Error("API Error"));

    await GeminiController.summarizeNews(req, res, next);

    expect(next).toHaveBeenCalledWith(new Error("API Error"));
  });
});
