const request = require("supertest");
const app = require("../../app");
const { Collection, User } = require("../../models");
const { signToken } = require("../../helpers/jwt");

// We're using partial mock to allow some real DB operations while mocking others
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

describe("CollectionController - Advanced Branch Coverage", () => {
  let token;
  let testUser;

  beforeAll(async () => {
    try {
      // Create a real user for authentication
      const uniqueEmail = `collection-advanced-${Date.now()}@example.com`;
      testUser = await User.create({
        email: uniqueEmail,
        password: "testpassword",
      });

      // Use the real user for token creation
      token = signToken({
        id: testUser.id,
        email: testUser.email,
      });
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /collections", () => {
    test("should handle database errors when listing collections", async () => {
      // Mock findAll to throw an error
      Collection.findAll.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get(`/users/${testUser.id}/collections`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });
  });

  describe("POST /collections", () => {
    test("should handle validation errors when creating collection", async () => {
      // Create a Sequelize validation error
      const validationError = new Error("Validation Error");
      validationError.name = "SequelizeValidationError";
      validationError.errors = [{ message: "Country is required" }];

      // Mock create to throw the validation error
      Collection.create.mockRejectedValueOnce(validationError);

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${token}`)
        .send({ language: "English", theme: "Technology" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Country is required");
    });
  });

  describe("PUT /collections/:id", () => {
    test("should handle the case when collection is not found during update", async () => {
      // Mock findByPk to return null (collection not found)
      Collection.findByPk.mockResolvedValueOnce(null);

      const response = await request(app)
        .put("/collections/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ country: "Germany", language: "German" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        `Collection with id 999 is not found`
      );
    });

    test("should handle database errors when updating", async () => {
      // Mock a collection with update method
      const mockCollection = {
        id: 1,
        userId: testUser.id,
        update: jest.fn().mockRejectedValueOnce(new Error("Update failed")),
      };

      // Mock findByPk to return our mock collection
      Collection.findByPk.mockResolvedValueOnce(mockCollection);

      const response = await request(app)
        .put("/collections/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ country: "Japan", language: "Japanese" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });

  // Additional tests for collection update and error handling scenarios
  describe("PUT /collections/:id error handling", () => {
    test("should handle validation errors when updating collection", async () => {
      // Mock a validation error when updating
      const validationError = new Error("Validation Error");
      validationError.name = "SequelizeValidationError";
      validationError.errors = [{ message: "Country is required" }];

      // Mock findByPk to return a collection with a failing update method
      const mockCollection = {
        id: 1,
        userId: testUser.id,
        update: jest.fn().mockRejectedValueOnce(validationError),
      };
      Collection.findByPk.mockResolvedValueOnce(mockCollection);

      // Test the error handling
      const response = await request(app)
        .put("/collections/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Invalid update" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Country is required");
    });

    test("should handle other database errors when updating", async () => {
      // Mock a general database error
      const dbError = new Error("Database Connection Error");

      // Mock findByPk to return a collection with a failing update method
      const mockCollection = {
        id: 1,
        userId: testUser.id,
        update: jest.fn().mockRejectedValueOnce(dbError),
      };
      Collection.findByPk.mockResolvedValueOnce(mockCollection);

      // Test the error handling
      const response = await request(app)
        .put("/collections/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Science" });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });

    test("should handle findByPk returning null during update", async () => {
      // Mock findByPk to return null (collection not found)
      Collection.findByPk.mockResolvedValueOnce(null);

      // Test the error handling
      const response = await request(app)
        .put("/collections/999999")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Science" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });
  });

  // Additional test for authorization edge case
  describe("PUT /collections/:id authorization edge cases", () => {
    test("should reject update from wrong user", async () => {
      // Mock a collection that belongs to a different user
      const mockCollection = {
        id: 1,
        userId: testUser.id + 100, // Different user
        update: jest.fn(),
      };
      Collection.findByPk.mockResolvedValueOnce(mockCollection);

      // Attempt to update someone else's collection
      const response = await request(app)
        .put("/collections/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "Unauthorized attempt" });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not authorized");
      expect(mockCollection.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /collections/:id", () => {
    test("should handle the case when collection is not found during delete", async () => {
      // Mock findByPk to return null (collection not found)
      Collection.findByPk.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete("/collections/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        `Collection with id 999 is not found`
      );
    });

    test("should handle database errors when deleting", async () => {
      // Mock a collection with destroy method
      const mockCollection = {
        id: 1,
        userId: testUser.id,
        theme: "Science",
        destroy: jest.fn().mockRejectedValueOnce(new Error("Delete failed")),
      };

      // Mock findByPk to return our mock collection
      Collection.findByPk.mockResolvedValueOnce(mockCollection);

      const response = await request(app)
        .delete("/collections/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message");
    });
  });
});
