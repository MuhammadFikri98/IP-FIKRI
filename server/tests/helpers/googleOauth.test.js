const { verifyGoogleToken } = require("../../helpers/googleOauth");
const { OAuth2Client } = require("google-auth-library");

// Mock Google Auth Library
jest.mock("google-auth-library");

describe("Google OAuth Helper", () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset environment for each test
    process.env = { ...originalEnv };
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test("should verify a valid Google token successfully", async () => {
    // Mock ticket and payload
    const mockPayload = {
      email: "test@gmail.com",
      name: "Test User",
      picture: "https://example.com/picture.jpg",
    };

    // Mock verifyIdToken function
    const mockVerifyIdToken = jest.fn().mockResolvedValue({
      getPayload: jest.fn().mockReturnValue(mockPayload),
    });

    // Mock OAuth2Client
    OAuth2Client.mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }));

    // Call the function
    const result = await verifyGoogleToken("valid-token");

    // Verify that verifyIdToken was called with correct parameters
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "valid-token",
      audience: "test-client-id",
    });

    // Verify the returned data
    expect(result).toEqual({
      email: mockPayload.email,
      name: mockPayload.name,
      picture: mockPayload.picture,
    });
  });

  test("should throw an error for invalid token", async () => {
    // Mock a failure in verification
    const mockError = new Error("Invalid token");
    const mockVerifyIdToken = jest.fn().mockRejectedValue(mockError);

    // Mock OAuth2Client
    OAuth2Client.mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }));

    // Call the function and expect it to throw
    await expect(verifyGoogleToken("invalid-token")).rejects.toMatchObject({
      name: "Unauthorized",
      message: "Invalid Google token",
    });
  });

  test("should initialize client with correct client ID", async () => {
    // Set custom client ID
    process.env.GOOGLE_CLIENT_ID = "custom-client-id";

    // Call the function (it will re-create the client)
    try {
      await verifyGoogleToken("any-token");
    } catch (error) {
      // We expect an error here, but we just want to check that OAuth2Client was called
    }

    // Verify that OAuth2Client was initialized with the correct client ID
    expect(OAuth2Client).toHaveBeenCalledWith("custom-client-id");
  });
});
