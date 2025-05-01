const request = require("supertest");
const app = require("../app");

describe("Error Handler Middleware - Complete Coverage", () => {
  test("Should handle SequelizeValidationError", async () => {
    const response = await request(app).get("/test-error?type=validation");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle SequelizeUniqueConstraintError", async () => {
    const response = await request(app).get("/test-error?type=unique");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle NotFound error", async () => {
    const response = await request(app).get("/test-error?type=notfound");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle BadRequest error", async () => {
    const response = await request(app).get("/test-error?type=badrequest");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle Forbidden error", async () => {
    const response = await request(app).get("/test-error?type=forbidden");

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle Unauthorized error", async () => {
    const response = await request(app).get("/test-error?type=unauthorized");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("Should handle generic errors", async () => {
    const response = await request(app).get("/test-error?type=generic");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal Server Error");
  });

  test("Should handle custom error status", async () => {
    const response = await request(app).get(
      "/test-error?type=custom&status=418"
    );

    expect(response.status).toBe(418);
    expect(response.body).toHaveProperty("message");
  });
});
