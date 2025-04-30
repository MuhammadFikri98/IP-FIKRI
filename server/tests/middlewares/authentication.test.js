const request = require("supertest");
const app = require("../../app");
const { signToken } = require("../../helpers/jwt");
const { User } = require("../../models");

describe("Authentication Middleware - Branch Coverage", () => {
  let userId;

  beforeEach(async () => {
    try {
      // Create test user
      const user = await User.create({
        email: "auth-test@example.com",
        password: "password123",
      });
      userId = user.id;
    } catch (error) {
      console.error("Test setup error:", error);
    }
  });

  afterEach(async () => {
    try {
      // Clean up
      await User.destroy({ where: { id: userId } });
    } catch (error) {
      console.error("Test cleanup error:", error);
    }
  });

  // Test missing authorization header
  test("should reject request without authorization header", async () => {
    const response = await request(app).get("/news/recommendations");
    // No authorization header

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  // Test invalid token format
  test("should reject request with malformed token", async () => {
    const response = await request(app)
      .get("/news/recommendations")
      .set("Authorization", "invalid-token-format");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  // Test incorrect token type
  test("should reject request with incorrect token type", async () => {
    const token = signToken({ id: userId });

    const response = await request(app)
      .get("/news/recommendations")
      .set("Authorization", `Basic ${token}`); // Using Basic instead of Bearer

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  // Test invalid JWT token
  test("should reject request with invalid JWT token", async () => {
    const response = await request(app)
      .get("/news/recommendations")
      .set("Authorization", "Bearer invalid-jwt-token");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  // Test token for non-existent user
  test("should reject token for deleted user", async () => {
    // Generate token for a user that will be deleted
    const token = signToken({ id: userId });

    // Delete the user
    await User.destroy({ where: { id: userId } });

    const response = await request(app)
      .get("/news/recommendations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });
});
