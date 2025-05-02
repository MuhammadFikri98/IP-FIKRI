const request = require("supertest");
const app = require("../app");
const { Collection } = require("../models");

// Mock dependencies
jest.mock("../models");

// Mock the authentication middleware
jest.mock("../middlewares/authentication", () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  });
});

// Mock the authorization middlewares
jest.mock("../middlewares/authorization", () => {
  return {
    userAuthorization: jest.fn((req, res, next) => {
      // Assume authorization passes
      next();
    }),
    collectionAuthorization: jest.fn((req, res, next) => {
      // Assume authorization passes
      next();
    }),
  };
});

describe("Collection Controller Endpoints", () => {
  // Mock data
  const mockCollection = {
    id: 1,
    name: "Technology News",
    country: "United States",
    language: "English",
    theme: "Technology",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /collections", () => {
    test("should create a new collection successfully", async () => {
      // Mock Collection.create to return a successful response
      Collection.create.mockResolvedValue(mockCollection);

      const response = await request(app).post("/collections").send({
        name: "Technology News",
        country: "United States",
        language: "English",
        theme: "Technology",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCollection);
      expect(Collection.create).toHaveBeenCalledWith({
        name: "Technology News",
        country: "United States",
        language: "English",
        theme: "Technology",
        userId: 1, // This should come from the authenticated user
      });
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/collections").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Required fields are missing"
      );
      expect(Collection.create).not.toHaveBeenCalled();
    });

    test("should return 500 if database error occurs", async () => {
      // Mock database error
      Collection.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/collections").send({
        name: "Technology News",
        country: "United States",
        language: "English",
        theme: "Technology",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /users/:userId/collections", () => {
    test("should return all collections for a user", async () => {
      // Mock findAll to return multiple collections
      Collection.findAll.mockResolvedValue([
        mockCollection,
        {
          ...mockCollection,
          id: 2,
          name: "Business News",
          theme: "Business",
        },
      ]);

      const response = await request(app).get("/users/1/collections");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(Collection.findAll).toHaveBeenCalledWith({
        where: { userId: "1" },
      });
    });

    test("should return empty array if no collections found", async () => {
      // Mock empty response
      Collection.findAll.mockResolvedValue([]);

      const response = await request(app).get("/users/1/collections");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("should return 400 for invalid user ID format", async () => {
      const response = await request(app).get("/users/invalid/collections");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid user ID format");
      expect(Collection.findAll).not.toHaveBeenCalled();
    });
  });

  describe("GET /collections/:id", () => {
    test("should return a specific collection", async () => {
      // Mock findByPk to return a collection
      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app).get("/collections/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollection);
      expect(Collection.findByPk).toHaveBeenCalledWith(1);
    });

    test("should return 404 if collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app).get("/collections/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should return 400 for invalid collection ID format", async () => {
      const response = await request(app).get("/collections/invalid");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
      expect(Collection.findByPk).not.toHaveBeenCalled();
    });
  });

  describe("PUT /collections/:id", () => {
    test("should update a collection successfully", async () => {
      // Mock finding the collection
      const mockUpdatedCollection = {
        ...mockCollection,
        name: "Updated Name",
        update: jest.fn().mockResolvedValue(true),
      };

      Collection.findByPk.mockResolvedValue(mockUpdatedCollection);

      const response = await request(app)
        .put("/collections/1")
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection updated successfully"
      );
      expect(response.body).toHaveProperty("collection");
      expect(mockUpdatedCollection.update).toHaveBeenCalledWith({
        name: "Updated Name",
      });
    });

    test("should return 404 if collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/collections/999")
        .send({ name: "Updated Name" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should return 400 for invalid collection ID format", async () => {
      const response = await request(app)
        .put("/collections/invalid")
        .send({ name: "Updated Name" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
      expect(Collection.findByPk).not.toHaveBeenCalled();
    });

    test("should return 400 if no fields provided for update", async () => {
      const response = await request(app).put("/collections/1").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "No fields provided for update"
      );
      expect(Collection.findByPk).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /collections/:id", () => {
    test("should delete a collection successfully", async () => {
      // Mock finding the collection
      const mockCollectionToDelete = {
        ...mockCollection,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Collection.findByPk.mockResolvedValue(mockCollectionToDelete);

      const response = await request(app).delete("/collections/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );
      expect(mockCollectionToDelete.destroy).toHaveBeenCalled();
    });

    test("should return 404 if collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app).delete("/collections/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should return 400 for invalid collection ID format", async () => {
      const response = await request(app).delete("/collections/invalid");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
      expect(Collection.findByPk).not.toHaveBeenCalled();
    });
  });
});
