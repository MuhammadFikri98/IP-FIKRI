const request = require("supertest");
const app = require("../../app");
const { Collection, User } = require("../../models");
const { signToken } = require("../../helpers/jwt");

// Mock models
jest.mock("../../models", () => {
  const mockSequelize = {
    define: jest.fn(),
    authenticate: jest.fn().mockResolvedValue(true),
  };

  const mockCollectionModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserModel = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };

  return {
    sequelize: mockSequelize,
    Sequelize: jest.fn(),
    Collection: mockCollectionModel,
    User: mockUserModel,
  };
});

describe("CollectionController - Complete Branch Coverage", () => {
  let token;
  let userId;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup test user and token
    userId = 999;
    token = signToken({ id: userId, email: "test@example.com" });
  });

  describe("POST /collections - create", () => {
    test("should create collection with all required fields", async () => {
      // Mock successful creation
      const newCollection = {
        id: 1,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.create.mockResolvedValue(newCollection);

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({
          country: "United States",
          language: "English",
          theme: "Technology",
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newCollection);
      expect(Collection.create).toHaveBeenCalledWith({
        country: "United States",
        language: "English",
        theme: "Technology",
        userId,
      });
    });

    test("should handle empty request body", async () => {
      // Test with no fields provided
      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      // This should result in validation error handled by errorHandler
      expect(response.status).toBe(400);
    });

    test("should handle database error during creation", async () => {
      // Mock database error
      const dbError = new Error("Database connection error");
      Collection.create.mockRejectedValue(dbError);

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({
          country: "United States",
          language: "English",
          theme: "Technology",
        });

      expect(response.status).toBe(500);
    });
  });

  describe("GET /users/:userId/collections - findAll", () => {
    test("should return empty array when no collections found", async () => {
      // Mock empty results
      Collection.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get(`/users/${userId}/collections`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return collections array when found", async () => {
      // Mock collection results
      const mockCollections = [
        {
          id: 1,
          userId,
          country: "United States",
          language: "English",
          theme: "Technology",
        },
        {
          id: 2,
          userId,
          country: "Japan",
          language: "Japanese",
          theme: "Science",
        },
      ];

      Collection.findAll.mockResolvedValue(mockCollections);

      const response = await request(app)
        .get(`/users/${userId}/collections`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollections);
      expect(Collection.findAll).toHaveBeenCalledWith({
        where: { userId: userId.toString() },
      });
    });

    test("should handle invalid userId format", async () => {
      const response = await request(app)
        .get("/users/invalid-id/collections")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });

    test("should handle database error during findAll", async () => {
      // Mock database error
      const dbError = new Error("Database connection error");
      Collection.findAll.mockRejectedValue(dbError);

      const response = await request(app)
        .get(`/users/${userId}/collections`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe("GET /collections/:id - findOne", () => {
    test("should return collection when found", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        country: "United States",
        language: "English",
        theme: "Technology",
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollection);
      expect(Collection.findByPk).toHaveBeenCalledWith(collectionId);
    });

    test("should handle collection not found", async () => {
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get("/collections/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should handle invalid id format", async () => {
      const response = await request(app)
        .get("/collections/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });

    test("should handle database error during findByPk", async () => {
      // Mock database error
      const dbError = new Error("Database connection error");
      Collection.findByPk.mockRejectedValue(dbError);

      const response = await request(app)
        .get("/collections/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe("PUT /collections/:id - update", () => {
    test("should update collection with all fields", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        country: "Japan",
        language: "Japanese",
        theme: "Technology",
        update: jest.fn().mockResolvedValue(true),
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const updateData = {
        country: "United States",
        language: "English",
        theme: "Science",
      };

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection updated successfully"
      );
      expect(mockCollection.update).toHaveBeenCalledWith(updateData);
    });

    test("should handle collection not found", async () => {
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/collections/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Science" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should handle validation error during update", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        country: "Japan",
        language: "Japanese",
        theme: "Technology",
        update: jest.fn().mockRejectedValue({
          name: "SequelizeValidationError",
          errors: [{ message: "Theme is required" }],
        }),
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "" });

      expect(response.status).toBe(400);
    });

    test("should handle empty update data", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        country: "Japan",
        language: "Japanese",
        theme: "Technology",
        update: jest.fn().mockResolvedValue(true),
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(mockCollection.update).toHaveBeenCalledWith({});
    });
  });

  describe("DELETE /collections/:id - delete", () => {
    test("should delete collection when found", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );
      expect(mockCollection.destroy).toHaveBeenCalled();
    });

    test("should handle collection not found", async () => {
      Collection.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete("/collections/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Collection with id 999 is not found"
      );
    });

    test("should handle destroy error", async () => {
      const collectionId = 1;
      const mockCollection = {
        id: collectionId,
        userId,
        destroy: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      Collection.findByPk.mockResolvedValue(mockCollection);

      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });
});
