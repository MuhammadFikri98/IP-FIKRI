const request = require("supertest");
const app = require("../../app");
const authentication = require("../../middlewares/authentication");
const {
  collectionAuthorization,
  userAuthorization,
} = require("../../middlewares/authorization");
const AuthController = require("../../controllers/AuthController");
const CollectionController = require("../../controllers/CollectionController");
const GeminiController = require("../../controllers/GeminiController");
const NewsController = require("../../controllers/NewsController");

// Mock all imported modules
jest.mock("../../middlewares/authentication");
jest.mock("../../middlewares/authorization");
jest.mock("../../controllers/AuthController");
jest.mock("../../controllers/CollectionController");
jest.mock("../../controllers/GeminiController");
jest.mock("../../controllers/NewsController");

describe("App Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default behavior for authentication middleware
    authentication.mockImplementation((req, res, next) => next());
    // Set up default behavior for authorization middlewares
    userAuthorization.mockImplementation((req, res, next) => next());
    collectionAuthorization.mockImplementation((req, res, next) => next());

    // Mock controller methods to return success responses
    AuthController.register.mockImplementation((req, res) =>
      res.status(201).json({ message: "Registered" })
    );
    AuthController.login.mockImplementation((req, res) =>
      res.status(200).json({ message: "Logged in" })
    );
    AuthController.googleLogin.mockImplementation((req, res) =>
      res.status(200).json({ message: "Google login success" })
    );

    CollectionController.create.mockImplementation((req, res) =>
      res.status(201).json({ message: "Collection created" })
    );
    CollectionController.findAll.mockImplementation((req, res) =>
      res.status(200).json({ collections: [] })
    );
    CollectionController.findOne.mockImplementation((req, res) =>
      res.status(200).json({ collection: {} })
    );
    CollectionController.update.mockImplementation((req, res) =>
      res.status(200).json({ message: "Collection updated" })
    );
    CollectionController.delete.mockImplementation((req, res) =>
      res.status(200).json({ message: "Collection deleted" })
    );

    NewsController.getRecommendedNews.mockImplementation((req, res) =>
      res.status(200).json({ news: [] })
    );

    GeminiController.generateContent.mockImplementation((req, res) =>
      res.status(200).json({ generatedContent: "content" })
    );
    GeminiController.summarizeNews.mockImplementation((req, res) =>
      res.status(200).json({ summary: "summary" })
    );
  });

  test("GET / should return Hello World", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World!");
  });

  describe("Auth Routes", () => {
    test("POST /register should call AuthController.register", async () => {
      await request(app).post("/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password",
      });

      expect(AuthController.register).toHaveBeenCalled();
    });

    test("POST /login should call AuthController.login", async () => {
      await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password" });

      expect(AuthController.login).toHaveBeenCalled();
    });

    test("POST /google-login should call AuthController.googleLogin", async () => {
      await request(app).post("/google-login").send({ token: "google-token" });

      expect(AuthController.googleLogin).toHaveBeenCalled();
    });
  });

  describe("Protected Routes", () => {
    test("should use authentication middleware for protected routes", async () => {
      // Test a protected route
      await request(app).get("/news/recommendations");

      expect(authentication).toHaveBeenCalled();
    });

    test("GET /news/recommendations should call NewsController.getRecommendedNews", async () => {
      await request(app).get("/news/recommendations");

      expect(NewsController.getRecommendedNews).toHaveBeenCalled();
    });

    test("POST /collections should call CollectionController.create", async () => {
      await request(app)
        .post("/collections")
        .send({ name: "Test Collection", theme: "Technology" });

      expect(CollectionController.create).toHaveBeenCalled();
    });

    test("GET /users/:userId/collections should use userAuthorization and call CollectionController.findAll", async () => {
      await request(app).get("/users/1/collections");

      expect(userAuthorization).toHaveBeenCalled();
      expect(CollectionController.findAll).toHaveBeenCalled();
    });

    test("GET /collections/:id should use collectionAuthorization and call CollectionController.findOne", async () => {
      await request(app).get("/collections/1");

      expect(collectionAuthorization).toHaveBeenCalled();
      expect(CollectionController.findOne).toHaveBeenCalled();
    });

    test("PUT /collections/:id should use collectionAuthorization and call CollectionController.update", async () => {
      await request(app)
        .put("/collections/1")
        .send({ name: "Updated Collection" });

      expect(collectionAuthorization).toHaveBeenCalled();
      expect(CollectionController.update).toHaveBeenCalled();
    });

    test("DELETE /collections/:id should use collectionAuthorization and call CollectionController.delete", async () => {
      await request(app).delete("/collections/1");

      expect(collectionAuthorization).toHaveBeenCalled();
      expect(CollectionController.delete).toHaveBeenCalled();
    });

    test("POST /gemini/generate should call GeminiController.generateContent", async () => {
      await request(app)
        .post("/gemini/generate")
        .send({ prompt: "Test prompt" });

      expect(GeminiController.generateContent).toHaveBeenCalled();
    });

    test("POST /gemini/summarize should call GeminiController.summarizeNews", async () => {
      await request(app)
        .post("/gemini/summarize")
        .send({ newsText: "Test news" });

      expect(GeminiController.summarizeNews).toHaveBeenCalled();
    });
  });

  // Test for branch coverage of line 28 in app.js
  test("should handle unknown route", async () => {
    const response = await request(app).get("/non-existent-route");

    expect(response.status).toBe(404); // Express default behavior for unknown routes
  });
});
