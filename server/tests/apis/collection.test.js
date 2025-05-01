const request = require("supertest");
const app = require("../../app");
const { User, Collection } = require("../../models");
const { signToken } = require("../../helpers/jwt");

let userId;
let access_token;
let collectionId;

// Setup test data
beforeAll(async () => {
  try {
    // Generate a unique email with timestamp to avoid conflicts
    const uniqueEmail = `collection-test-${Date.now()}@mail.com`;

    // Create test user
    const user = await User.create({
      email: uniqueEmail,
      password: "testpassword",
    });

    userId = user.id;

    // Create token for auth
    access_token = signToken({
      id: user.id,
      email: user.email,
    });

    // Create a test collection
    const collection = await Collection.create({
      userId: user.id,
      country: "United States",
      language: "English",
      theme: "Technology",
    });

    collectionId = collection.id;
  } catch (error) {
    console.error("Error in collection test setup:", error);
  }
});

// Cleanup test data
afterAll(async () => {
  try {
    await Collection.destroy({ where: { userId } });
    await User.destroy({ where: { id: userId } });
  } catch (error) {
    console.error("Error in collection test cleanup:", error);
  }
});

describe("Collection API Endpoints", () => {
  describe("POST /collections", () => {
    test("Should create a new collection", async () => {
      const newCollection = {
        country: "Japan",
        language: "Japanese",
        theme: "Science",
      };

      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${access_token}`)
        .send(newCollection);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("userId", userId);
      expect(response.body).toHaveProperty("country", "Japan");
      expect(response.body).toHaveProperty("language", "Japanese");
      expect(response.body).toHaveProperty("theme", "Science");
    });

    test("Should handle error during collection creation", async () => {
      // Send invalid data to trigger error
      const response = await request(app)
        .post("/collections")
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    test("Should require authentication", async () => {
      const response = await request(app).post("/collections").send({
        country: "Brazil",
        language: "Portuguese",
        theme: "Sports",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid token");
    });
  });

  describe("GET /users/:userId/collections", () => {
    test("Should get user's collections", async () => {
      const response = await request(app)
        .get(`/users/${userId}/collections`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check first collection has expected properties
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("userId", userId);
      expect(response.body[0]).toHaveProperty("country");
      expect(response.body[0]).toHaveProperty("language");
      expect(response.body[0]).toHaveProperty("theme");
    });

    test("Should not allow access to another user's collections", async () => {
      // Create another user
      const anotherUser = await User.create({
        email: "another-user@mail.com",
        password: "testpassword",
      });

      const response = await request(app)
        .get(`/users/${anotherUser.id}/collections`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "You are not authorized to access this resource"
      );

      // Clean up
      await User.destroy({ where: { id: anotherUser.id } });
    });

    test("Should handle error during collection retrieval", async () => {
      // Force error by sending invalid userId format
      const response = await request(app)
        .get(`/users/invalid-id/collections`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).not.toBe(200);
    });
  });

  describe("PUT /collections/:id", () => {
    test("Should update collection", async () => {
      const updatedData = {
        country: "Germany",
        language: "German",
        theme: "Technology",
      };

      const response = await request(app)
        .put(`/collections/${collectionId}`)
        .set("Authorization", `Bearer ${access_token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection updated successfully"
      );
    });

    test("Should not find non-existent collection", async () => {
      const response = await request(app)
        .put(`/collections/999999`)
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          country: "Italy",
          language: "Italian",
          theme: "Art",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });

    test("Should not allow updating another user's collection", async () => {
      // Create another user and their collection
      const anotherUser = await User.create({
        email: "another-user2@mail.com",
        password: "testpassword",
      });

      const anotherCollection = await Collection.create({
        userId: anotherUser.id,
        country: "France",
        language: "French",
        theme: "Food",
      });

      const response = await request(app)
        .put(`/collections/${anotherCollection.id}`)
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          theme: "Updated theme",
        });

      expect(response.status).toBe(403);

      // Clean up
      await Collection.destroy({ where: { id: anotherCollection.id } });
      await User.destroy({ where: { id: anotherUser.id } });
    });
  });

  describe("DELETE /collections/:id", () => {
    test("Should delete collection", async () => {
      // Create a collection to delete
      const collectionToDelete = await Collection.create({
        userId,
        country: "Spain",
        language: "Spanish",
        theme: "Travel",
      });

      const response = await request(app)
        .delete(`/collections/${collectionToDelete.id}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );

      // Verify it's deleted
      const deletedCollection = await Collection.findByPk(
        collectionToDelete.id
      );
      expect(deletedCollection).toBeNull();
    });

    test("Should not find non-existent collection", async () => {
      const response = await request(app)
        .delete(`/collections/999999`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("not found");
    });

    test("Should handle server errors during deletion", async () => {
      // Create a test collection
      const errorCollection = await Collection.create({
        userId,
        country: "Australia",
        language: "English",
        theme: "Nature",
      });

      // Get the original findByPk method
      const originalFindByPk = Collection.findByPk;

      // Mock findByPk to return a collection with a destroy method that throws an error
      Collection.findByPk = jest.fn().mockResolvedValueOnce({
        id: errorCollection.id,
        userId,
        destroy: jest.fn().mockRejectedValueOnce(new Error("Database error")),
      });

      const response = await request(app)
        .delete(`/collections/${errorCollection.id}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal Server Error");

      // Restore the original method
      Collection.findByPk = originalFindByPk;

      // Clean up the test collection
      await Collection.destroy({ where: { id: errorCollection.id } });
    });
  });
});
