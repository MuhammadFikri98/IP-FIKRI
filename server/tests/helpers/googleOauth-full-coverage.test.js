const { OAuth2Client } = require("google-auth-library");
const { verifyGoogleToken } = require("../../helpers/googleOauth");

// Mock OAuth2Client
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn(),
      };
    }),
  };
});

describe("Google OAuth Helper - Complete Coverage", () => {
  const mockClientId = "mock-client-id";
  const mockToken = "mock-google-token";
  let mockVerifyIdToken;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = mockClientId;

    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked verifyIdToken function
    const mockOAuthClient = new OAuth2Client();
    mockVerifyIdToken = mockOAuthClient.verifyIdToken;
  });

  afterEach(() => {
    // Clean up
    delete process.env.GOOGLE_CLIENT_ID;
  });

  test("should verify a valid Google token", async () => {
    // Mock a successful token verification
    const mockPayload = {
      email: "test@example.com",
      name: "Test User",
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload,
    });

    const result = await verifyGoogleToken(mockToken);

    expect(result).toEqual(mockPayload);
    expect(OAuth2Client).toHaveBeenCalledWith(mockClientId);
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: mockToken,
      audience: mockClientId,
    });
  });

  test("should throw error for invalid token", async () => {
    // Mock a failed token verification
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

    await expect(verifyGoogleToken(mockToken)).rejects.toThrow(
      "Invalid Google token"
    );
  });

  test("should throw error when client ID is not configured", async () => {
    // Remove Google client ID from environment
    delete process.env.GOOGLE_CLIENT_ID;

    await expect(verifyGoogleToken(mockToken)).rejects.toThrow(
      "Google OAuth client ID is not configured"
    );
  });

  test("should throw error for empty token", async () => {
    await expect(verifyGoogleToken("")).rejects.toThrow("Token is required");
    await expect(verifyGoogleToken(null)).rejects.toThrow("Token is required");
    await expect(verifyGoogleToken(undefined)).rejects.toThrow(
      "Token is required"
    );
  });
});
