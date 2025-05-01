const dotenv = require("dotenv");
const request = require("supertest");
const path = require("path");

// Mock dotenv.config
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

// Mock the models to prevent database connection issues
jest.mock(
  "../models",
  () => ({
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
    },
  }),
  { virtual: true }
);

describe("App Environment Tests", () => {
  // Save original NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;

  // Reset environment between tests
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  test("should load environment variables in development mode", async () => {
    // Set development environment
    process.env.NODE_ENV = "development";

    // Clear module cache to ensure app.js is reloaded with new env
    jest.resetModules();

    // Set up database config to avoid connection issues
    process.env.DATABASE_URL = "sqlite::memory:";

    // Create a simple mock for the authentication middleware
    jest.mock(
      "../middlewares/authentication",
      () => (req, res, next) => next(),
      { virtual: true }
    );

    // Import app.js which should trigger dotenv.config()
    const app = require("../app");

    // Make a simple request to verify app is working
    const response = await request(app).get("/");
    expect(response.status).toBe(200);

    // Verify dotenv.config was called
    expect(dotenv.config).toHaveBeenCalled();
  });

  test("should not load environment variables in production mode", async () => {
    // Set production environment
    process.env.NODE_ENV = "production";

    // Clear module cache
    jest.resetModules();

    // Set up database config to avoid connection issues
    process.env.DATABASE_URL = "sqlite::memory:";

    // Create a simple mock for the authentication middleware
    jest.mock(
      "../middlewares/authentication",
      () => (req, res, next) => next(),
      { virtual: true }
    );

    // Import app.js which should NOT trigger dotenv.config()
    const app = require("../app");

    // Make a simple request to verify app is working
    const response = await request(app).get("/");
    expect(response.status).toBe(200);

    // Verify dotenv.config was not called
    expect(dotenv.config).not.toHaveBeenCalled();
  });
});
