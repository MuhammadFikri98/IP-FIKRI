const { verifyGoogleToken } = require("../../helpers/googleOauth");
const { OAuth2Client } = require("google-auth-library");

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

describe("Google OAuth Helper", () => {
  let mockVerifyIdToken;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Get the mock instance of OAuth2Client
    const mockOAuthInstance = new OAuth2Client();
    mockVerifyIdToken = mockOAuthInstance.verifyIdToken;
  });

  test("verifyGoogleToken should return user data from a valid token", async () => {
    // Mock successful verification
    const mockPayload = {
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/profile.jpg",
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: jest.fn().mockReturnValue(mockPayload),
    });

    const result = await verifyGoogleToken("valid_token");

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "valid_token",
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    expect(result).toEqual({
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/profile.jpg",
    });
  });

  test("verifyGoogleToken should throw an error for invalid token", async () => {
    // Mock verification failure
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

    // Use try/catch to test error handling
    try {
      await verifyGoogleToken("invalid_token");
      // If we reach here, the test should fail
      expect(true).toBe(false); // This line should not be reached
    } catch (error) {
      expect(error).toHaveProperty("name", "Unauthorized");
      expect(error).toHaveProperty("message", "Invalid Google token");
    }

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "invalid_token",
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  });

  test("verifyGoogleToken should handle unexpected errors", async () => {
    // Mock a different type of error
    mockVerifyIdToken.mockRejectedValue(new Error("Network error"));

    await expect(verifyGoogleToken("token")).rejects.toEqual({
      name: "Unauthorized",
      message: "Invalid Google token",
    });
  });
});
