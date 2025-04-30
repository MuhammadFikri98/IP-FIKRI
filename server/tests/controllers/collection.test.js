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
  });
});
