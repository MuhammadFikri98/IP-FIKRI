// This test specifically targets line 16 in googleOauth.js (console.error in catch block)
const { verifyGoogleToken } = require("../../helpers/googleOauth");
const { OAuth2Client } = require("google-auth-library");

// Mock console.error to verify it's called
const originalConsoleError = console.error;
console.error = jest.fn();

// Mock google-auth-library
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn(),
      };
    }),
  };
});

describe("Google OAuth Helper - Console Error Coverage", () => {
  let mockVerifyIdToken;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error.mockClear();

    // Get the mock instance of OAuth2Client
    const mockOAuthInstance = new OAuth2Client();
    mockVerifyIdToken = mockOAuthInstance.verifyIdToken;
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  test("verifyGoogleToken should log error to console when verification fails", async () => {
    // Mock a detailed error
    const detailedError = new Error("Invalid token");
    detailedError.stack = "Error stack trace";

    mockVerifyIdToken.mockRejectedValue(detailedError);

    try {
      await verifyGoogleToken("invalid_token");
      fail("Should have thrown an error");
    } catch (error) {
      // Verify console.error was called (line 16)
      expect(console.error).toHaveBeenCalledWith(
        "Error verifying Google token:",
        expect.any(Error)
      );
      expect(error).toHaveProperty("name", "Unauthorized");
      expect(error).toHaveProperty("message", "Invalid Google token");
    }
  });
});
