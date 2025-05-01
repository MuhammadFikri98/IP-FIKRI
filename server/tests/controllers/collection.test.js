const request = require("supertest");
const app = require("../../app");
const { Collection, User } = require("../../models");
const { signToken } = require("../../helpers/jwt");

// We need to mock Collection but keep User real for authentication
jest.mock("../../models", () => {
  const actualModels = jest.requireActual("../../models");
  return {
    ...actualModels,
    Collection: {
      ...actualModels.Collection,
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
    },
  };
});

describe("CollectionController - Additional Branch Tests", () => {
  let userId;
  let token;
  let collectionId;
  let testUser;

  beforeAll(async () => {
    jest.clearAllMocks();

    try {
      // Create a real user for authentication
      const uniqueEmail = `collection-test-ctrl-${Date.now()}@example.com`;
      testUser = await User.create({
        email: uniqueEmail,
        password: "testpassword",
      });

      userId = testUser.id;

      // Use the real user for token creation
      token = signToken({
        id: userId,
        email: testUser.email,
      });

      // Mock a collection for testing
      const mockCollection = {
        id: 123,
        userId: userId,
        country: "United States",
        language: "English",
        theme: "Technology",
        update: jest.fn().mockResolvedValue(true),
        destroy: jest.fn().mockResolvedValue(true),
      };

      // Setup mock responses
      Collection.create.mockResolvedValue(mockCollection);
      Collection.findByPk.mockResolvedValue(mockCollection);
      Collection.findAll.mockResolvedValue([mockCollection]);

      collectionId = mockCollection.id;
    } catch (error) {
      console.error("Setup error:", error);
    }
  });

  afterAll(async () => {
    try {
      // Clean up test user
      if (testUser && testUser.id) {
        await User.destroy({ where: { id: testUser.id } });
      }

      // Restore original implementations
      jest.restoreAllMocks();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("GET /collections", () => {
    test("should retrieve all collections for user", async () => {
      const response = await request(app)
        .get(`/users/${userId}/collections`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    // New tests for findAll validation branches
    test("should handle invalid userId format", async () => {
      const response = await request(app)
        .get("/users/invalid/collections")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid user ID format");
    });

    test("should handle missing userId", async () => {
      const response = await request(app)
        .get("/users//collections")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404); // This is a route not found error
    });
  });

  describe("POST /collections", () => {
    test("should create a new collection successfully", async () => {
      const newCollection = {
        country: "Japan",
        language: "Japanese",
        theme: "Culture",
      };

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send(newCollection);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });

    // New test for create validation branch
    test("should handle empty request body", async () => {
      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Required fields are missing"
      );
    });

    test("should handle server error during creation", async () => {
      // Mock a database error
      Collection.create.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({
          country: "Germany",
          language: "German",
          theme: "Science",
        });

      expect(response.status).toBe(500);
    });
  });

  describe("PUT /collections/:id", () => {
    test("should update collection successfully", async () => {
      const updatedData = {
        country: "Germany",
        language: "German",
        theme: "Science",
      };

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection updated successfully"
      );
    });

    // New tests for update validation branches
    test("should handle invalid collection ID format", async () => {
      const response = await request(app)
        .put("/collections/invalid")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Science" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
    });

    test("should handle empty request body", async () => {
      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "No fields provided for update"
      );
    });

    test("should handle collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Science" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        `Collection with id ${collectionId} is not found`
      );
    });

    test("should handle database error during update", async () => {
      // Mock a collection that throws an error on update
      const errorCollection = {
        id: collectionId,
        userId: userId,
        update: jest.fn().mockRejectedValueOnce(new Error("Database error")),
      };

      Collection.findByPk.mockResolvedValueOnce(errorCollection);

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Error" });

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /collections/:id", () => {
    test("should delete collection successfully", async () => {
      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );
    });

    // New tests for delete validation branches
    test("should handle invalid collection ID format", async () => {
      const response = await request(app)
        .delete("/collections/invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
    });

    test("should handle collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        `Collection with id ${collectionId} is not found`
      );
    });

    test("should handle database error during deletion", async () => {
      // Mock a collection that throws an error on destroy
      const errorCollection = {
        id: collectionId,
        userId: userId,
        destroy: jest.fn().mockRejectedValueOnce(new Error("Database error")),
      };

      Collection.findByPk.mockResolvedValueOnce(errorCollection);

      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe("GET /collections/:id - findOne", () => {
    test("should find collection by ID", async () => {
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", collectionId);
    });

    test("should handle invalid collection ID format", async () => {
      const response = await request(app)
        .get("/collections/invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid collection ID format"
      );
    });

    test("should handle collection not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        `Collection with id ${collectionId} is not found`
      );
    });

    test("should handle database error", async () => {
      // Mock database error
      Collection.findByPk.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });
});
