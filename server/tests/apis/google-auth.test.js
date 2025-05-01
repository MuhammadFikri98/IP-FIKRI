const request = require("supertest");
const app = require("../../app");
const { User } = require("../../models");
const { verifyGoogleToken } = require("../../helpers/googleOauth");

// Mock the googleOauth helper
jest.mock("../../helpers/googleOauth");

describe("Google Login API", () => {
  beforeAll(async () => {
    await User.destroy({
      where: { email: "google-user@gmail.com" },
    });
  });

  afterAll(async () => {
    await User.destroy({
      where: { email: "google-user@gmail.com" },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should login with Google successfully for new user", async () => {
    // Mock the Google OAuth verification
    verifyGoogleToken.mockResolvedValue({
      email: "google-user@gmail.com",
      name: "Google User",
      picture: "https://example.com/picture.jpg",
    });

    const response = await request(app)
      .post("/google-login")
      .send({ token: "valid-google-token" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("access_token");

    // Verify the user was created
    const user = await User.findOne({
      where: { email: "google-user@gmail.com" },
    });
    expect(user).not.toBeNull();
  });

  test("Should login with Google successfully for existing user", async () => {
    // Create a user first
    const existingUser = await User.create({
      email: "google-user@gmail.com",
      password: "somepassword",
    });

    // Mock the Google OAuth verification
    verifyGoogleToken.mockResolvedValue({
      email: "google-user@gmail.com",
      name: "Google User",
      picture: "https://example.com/picture.jpg",
    });

    const response = await request(app)
      .post("/google-login")
      .send({ token: "valid-google-token" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("access_token");
  });

  test("Should fail to login with Google without token", async () => {
    const response = await request(app).post("/google-login").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Google token is required");
  });

  test("Should handle invalid Google token", async () => {
    // Mock the Google OAuth verification to fail
    verifyGoogleToken.mockRejectedValue({
      name: "Unauthorized",
      message: "Invalid Google token",
    });

    const response = await request(app)
      .post("/google-login")
      .send({ token: "invalid-google-token" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid Google token");
  });
});
