const request = require("supertest");
const app = require("../../app");
const GeminiHelper = require("../../helpers/gemini");

// Mock dependencies
jest.mock("../../helpers/gemini");

// Mock the authentication middleware
jest.mock("../../middlewares/authentication", () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  });
});

describe("GeminiController Error Paths", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /generate-content", () => {
    // This test specifically targets line 14 in GeminiController.js
    test("should pass the exact error object to next() when error occurs", async () => {
      // Create a custom error object
      const customError = {
        code: "CUSTOM_ERROR",
        message: "Custom error message",
        details: "Additional error details",
      };

      // Mock the helper to throw our custom error
      GeminiHelper.generateContent.mockRejectedValue(customError);

      // Set up middleware to capture the error
      const originalErrorHandler = app._router.stack.find(
        (layer) => layer.name === "errorHandler"
      );

      // Replace error handler temporarily to verify the exact error being passed
      let capturedError;
      app._router.stack.forEach((layer) => {
        if (layer.name === "errorHandler") {
          layer.handle = (err, req, res, next) => {
            capturedError = err;
            res.status(500).json({ message: "Test intercepted error" });
          };
        }
      });

      // Make request that will trigger the error
      await request(app)
        .post("/generate-content")
        .send({ prompt: "Test prompt" });

      // Verify the exact error object was passed to next()
      expect(capturedError).toBe(customError);

      // Restore original error handler
      app._router.stack.forEach((layer) => {
        if (layer.name === "errorHandler") {
          layer.handle = originalErrorHandler.handle;
        }
      });
    });
  });

  describe("POST /summarize-news", () => {
    // This test specifically targets line 32 in GeminiController.js
    test("should pass the exact error object to next() when error occurs in summarizeNews", async () => {
      // Create a custom error object
      const customError = {
        code: "SUMMARY_ERROR",
        message: "Summary error message",
        details: "Additional error details for summary",
      };

      // Mock the helper to throw our custom error
      GeminiHelper.summarize.mockRejectedValue(customError);

      // Set up middleware to capture the error
      const originalErrorHandler = app._router.stack.find(
        (layer) => layer.name === "errorHandler"
      );

      // Replace error handler temporarily to verify the exact error being passed
      let capturedError;
      app._router.stack.forEach((layer) => {
        if (layer.name === "errorHandler") {
          layer.handle = (err, req, res, next) => {
            capturedError = err;
            res.status(500).json({ message: "Test intercepted error" });
          };
        }
      });

      // Make request that will trigger the error
      await request(app)
        .post("/summarize-news")
        .send({ newsText: "Test news" });

      // Verify the exact error object was passed to next()
      expect(capturedError).toBe(customError);

      // Restore original error handler
      app._router.stack.forEach((layer) => {
        if (layer.name === "errorHandler") {
          layer.handle = originalErrorHandler.handle;
        }
      });
    });
  });
});
