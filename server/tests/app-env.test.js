const request = require("supertest");
const originalEnv = process.env.NODE_ENV;

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

describe("App Environment Configuration", () => {
  // Reset modules after each test
  afterEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = originalEnv;
  });

  // Test environment configuration
  test("should load environment variables in non-production", async () => {
    // Set to development for testing
    process.env.NODE_ENV = "development";

    // Reset modules to ensure fresh load
    jest.resetModules();

    // Set up database config to avoid connection issues
    process.env.DATABASE_URL = "sqlite::memory:";

    // Mock the authentication middleware to prevent JWT errors
    jest.mock(
      "../middlewares/authentication",
      () => (req, res, next) => next(),
      { virtual: true }
    );

    // Require app with correct path
    const app = require("../app");

    // Basic test to ensure app is working
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  test("should not load dotenv in production", async () => {
    // Set to production for testing
    process.env.NODE_ENV = "production";

    // Force module cache clear to ensure fresh load
    jest.resetModules();

    // Set up database config to avoid connection issues
    process.env.DATABASE_URL = "sqlite::memory:";

    // Mock dotenv to check if it's called
    jest.mock("dotenv", () => ({
      config: jest.fn(),
    }));

    // Mock the authentication middleware to prevent JWT errors
    jest.mock(
      "../middlewares/authentication",
      () => (req, res, next) => next(),
      { virtual: true }
    );

    // Require app with correct path
    const app = require("../app");
    const dotenv = require("dotenv");

    // Verify dotenv was not called
    expect(dotenv.config).not.toHaveBeenCalled();

    // Basic test to ensure app is still working
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });
});
