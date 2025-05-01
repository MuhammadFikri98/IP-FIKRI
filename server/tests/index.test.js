const request = require("supertest");
const app = require("../app");
const { User, sequelize } = require("../models");
const { hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");

let access_token;
let userId;

beforeAll(async () => {
  try {
    // Clear users table and recreate test user
    await User.destroy({
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });

    // Create test user
    const user = await User.create({
      email: "test@mail.com",
      password: "password123",
    });

    userId = user.id;
    access_token = signToken({
      id: user.id,
      email: user.email,
    });

  } catch (error) {
    console.error("Error in test setup:", error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe("App Endpoints", () => {
  test("Should return a welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World!");
  });
});

// Import all test files
require("./apis/auth.test");
require("./apis/collection.test");
require("./apis/news.test");