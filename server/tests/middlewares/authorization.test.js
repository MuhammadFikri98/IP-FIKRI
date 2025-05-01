const request = require("supertest");
const express = require("express");
const authorization = require("../../middlewares/authorization");
const authentication = require("../../middlewares/authentication");
const { Collection, User } = require("../../models");
const { signToken } = require("../../helpers/jwt");

describe("Authorization Middleware", () => {
  let app;
  let userId1;
  let userId2;
  let user1Token;
  let user2Token;
  let collectionId;

  beforeAll(async () => {
    // Create test users
    const user1 = await User.create({
      email: "auth-test1@mail.com",
      password: "testpassword1",
    });

    const user2 = await User.create({
      email: "auth-test2@mail.com",
      password: "testpassword2",
    });

    userId1 = user1.id;
    userId2 = user2.id;

    // Create tokens
    user1Token = signToken({
      id: user1.id,
      email: user1.email,
    });

    user2Token = signToken({
      id: user2.id,
      email: user2.email,
    });

    // Create a collection for user1
    const collection = await Collection.create({
      title: "Test Collection",
      theme: "News",
      country: "United States",
      language: "English",
      userId: userId1,
    });

    collectionId = collection.id;
  });

  afterAll(async () => {
    // Clean up test data
    await Collection.destroy({ where: { id: collectionId } });
    await User.destroy({ where: { id: [userId1, userId2] } });
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Attach user to request for testing authorization
    app.use((req, res, next) => {
      req.params = req.params || {};
      next();
    });

    // Test routes for collection authorization
    app.get(
      "/collections/:id",
      (req, res, next) => {
        req.user = { id: parseInt(req.headers.userid) };
        next();
      },
      authorization.collectionAuthorization,
      (req, res) => {
        res.json({
          message: "Collection accessed successfully",
          collection: req.collection,
        });
      }
    );

    // Test routes for user authorization
    app.get(
      "/users/:userId/collections",
      (req, res, next) => {
        req.user = { id: parseInt(req.headers.userid) };
        next();
      },
      authorization.userAuthorization,
      (req, res) => {
        res.json({
          message: "User collections accessed successfully",
        });
      }
    );
  });

  describe("collectionAuthorization middleware", () => {
    test("Should allow owner to access their collection", async () => {
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("userId", userId1);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection accessed successfully"
      );
    });

    test("Should not allow access to non-existent collection", async () => {
      const response = await request(app)
        .get("/collections/9999999")
        .set("userId", userId1);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("not found")
      );
    });

    test("Should not allow other users to access collection", async () => {
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("userId", userId2);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("not authorized")
      );
    });
  });

  describe("userAuthorization middleware", () => {
    test("Should allow user to access their own collections", async () => {
      const response = await request(app)
        .get(`/users/${userId1}/collections`)
        .set("userId", userId1);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User collections accessed successfully"
      );
    });

    test("Should not allow user to access other user's collections", async () => {
      const response = await request(app)
        .get(`/users/${userId1}/collections`)
        .set("userId", userId2);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("not authorized")
      );
    });
  });
});

// Additional tests for authorization middleware error handling

describe("Error handling in authorization middleware", () => {
  let mockApp;

  beforeEach(() => {
    mockApp = express();
    mockApp.use(express.json());

    // Clear previous mocks
    jest.clearAllMocks();
  });

  test("Should handle errors in collectionAuthorization middleware", async () => {
    // Setup test route with error-throwing mock
    mockApp.get(
      "/test-collection-error/:id",
      (req, res, next) => {
        req.user = { id: 1 };
        next();
      },
      (req, res, next) => {
        // Mock Collection.findByPk to throw an error
        jest.spyOn(Collection, "findByPk").mockImplementationOnce(() => {
          throw new Error("Database error");
        });

        // Call the middleware directly
        return authorization.collectionAuthorization(req, res, next);
      }
    );

    const response = await request(mockApp).get("/test-collection-error/1");

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal Server Error");
  });

  test("Should handle errors in userAuthorization middleware", async () => {
    // Setup test route with error-throwing mock
    mockApp.get(
      "/test-user-error/:userId",
      (req, res, next) => {
        // Force an error by making the userId parameter non-numeric
        req.params.userId = "not-a-number";
        req.user = { id: 1 };
        next();
      },
      (req, res, next) => {
        // Call the middleware directly
        return authorization.userAuthorization(req, res, next);
      }
    );

    const response = await request(mockApp).get(
      "/test-user-error/not-a-number"
    );

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal Server Error");
  });
});
