const request = require("supertest");
const express = require("express");
const errorHandler = require("../../middlewares/errorHandler");

describe("Error Handler Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Route that throws specific errors for testing
    app.get("/test-error", (req, res, next) => {
      const errorType = req.query.type;

      switch (errorType) {
        case "validation":
          next({
            name: "SequelizeValidationError",
            errors: [{ message: "Validation error message" }],
          });
          break;
        case "unique":
          next({
            name: "SequelizeUniqueConstraintError",
            errors: [{ message: "Unique constraint error message" }],
          });
          break;
        case "badrequest":
          next({ name: "BadRequest", message: "Bad request error message" });
          break;
        case "forbidden":
          next({ name: "Forbidden", message: "Forbidden error message" });
          break;
        case "unauthorized":
          next({ name: "Unauthorized", message: "Unauthorized error message" });
          break;
        case "jwt":
          next({ name: "JsonWebTokenError", message: "Invalid token" });
          break;
        case "notfound":
          next({ name: "Not Found", message: "Resource not found" });
          break;
        default:
          next(new Error("Internal server error message"));
          break;
      }
    });

    // Apply the error handler middleware
    app.use(errorHandler);
  });

  test("Should handle SequelizeValidationError", async () => {
    const response = await request(app).get("/test-error?type=validation");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error message");
  });

  test("Should handle SequelizeUniqueConstraintError", async () => {
    const response = await request(app).get("/test-error?type=unique");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Unique constraint error message"
    );
  });

  test("Should handle BadRequest error", async () => {
    const response = await request(app).get("/test-error?type=badrequest");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Bad request error message"
    );
  });

  test("Should handle Forbidden error", async () => {
    const response = await request(app).get("/test-error?type=forbidden");

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Forbidden error message");
  });

  test("Should handle Unauthorized error", async () => {
    const response = await request(app).get("/test-error?type=unauthorized");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Unauthorized error message"
    );
  });

  test("Should handle JsonWebTokenError", async () => {
    const response = await request(app).get("/test-error?type=jwt");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  test("Should handle Not Found error", async () => {
    const response = await request(app).get("/test-error?type=notfound");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Resource not found");
  });

  test("Should handle generic errors", async () => {
    const response = await request(app).get("/test-error?type=generic");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal Server Error");
  });
});
