const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { comparePassword } = require("../helpers/bcrypt");
const { verifyGoogleToken } = require("../helpers/googleOauth");

// Mock dependencies
jest.mock("../models");
jest.mock("../helpers/jwt");
jest.mock("../helpers/bcrypt");
jest.mock("../helpers/googleOauth");

describe("Authentication Endpoints", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    test("should register a new user successfully", async () => {
      // Mock User.create to return a successful response
      User.create.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword123",
      });

      const response = await request(app).post("/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).not.toHaveProperty("password");
      expect(User.create).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    test("should return 400 if validation fails", async () => {
      // Mock validation error
      User.create.mockRejectedValue({
        name: "SequelizeValidationError",
        errors: [{ message: "Email format is wrong" }],
      });

      const response = await request(app).post("/register").send({
        email: "invalid-email",
        password: "pwd",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email format is wrong");
    });

    test("should return 400 if email already exists", async () => {
      // Mock unique constraint error
      User.create.mockRejectedValue({
        name: "SequelizeUniqueConstraintError",
        errors: [{ message: "Email already exists" }],
      });

      const response = await request(app).post("/register").send({
        email: "existing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email already exists");
    });
  });

  describe("POST /login", () => {
    test("should login successfully with valid credentials", async () => {
      // Mock successful login
      User.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword123",
      });
      comparePassword.mockReturnValue(true);
      signToken.mockReturnValue("valid_token_string");

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "access_token",
        "valid_token_string"
      );
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(comparePassword).toHaveBeenCalledWith(
        "password123",
        "hashedpassword123"
      );
      expect(signToken).toHaveBeenCalledWith({
        id: 1,
        email: "test@example.com",
      });
    });

    test("should return 400 if email is missing", async () => {
      const response = await request(app)
        .post("/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email is required");
    });

    test("should return 400 if password is missing", async () => {
      const response = await request(app)
        .post("/login")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Password is required");
    });

    test("should return 401 if credentials are invalid", async () => {
      // Mock user not found
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid email/password");
    });

    test("should return 401 if password is incorrect", async () => {
      // Mock incorrect password
      User.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword123",
      });
      comparePassword.mockReturnValue(false);

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid email/password");
    });
  });

  describe("POST /google-login", () => {
    test("should login with Google token for existing user", async () => {
      // Mock Google token verification
      verifyGoogleToken.mockResolvedValue({
        email: "google@example.com",
        name: "Google User",
      });

      // Mock existing user
      User.findOne.mockResolvedValue({
        id: 2,
        email: "google@example.com",
        password: "hashedpassword456",
      });

      signToken.mockReturnValue("google_token_string");

      const response = await request(app)
        .post("/google-login")
        .send({ token: "valid_google_token" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "access_token",
        "google_token_string"
      );
      expect(verifyGoogleToken).toHaveBeenCalledWith("valid_google_token");
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "google@example.com" },
      });
      expect(signToken).toHaveBeenCalledWith({
        id: 2,
        email: "google@example.com",
      });
    });

    test("should create new user and login with Google token for new user", async () => {
      // Mock Google token verification
      verifyGoogleToken.mockResolvedValue({
        email: "newgoogle@example.com",
        name: "New Google User",
      });

      // Mock user not found, then creation
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 3,
        email: "newgoogle@example.com",
        password: "some_random_password",
      });

      signToken.mockReturnValue("new_google_token_string");

      const response = await request(app)
        .post("/google-login")
        .send({ token: "valid_google_token" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "access_token",
        "new_google_token_string"
      );
      expect(verifyGoogleToken).toHaveBeenCalledWith("valid_google_token");
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "newgoogle@example.com" },
      });
      expect(User.create).toHaveBeenCalledWith({
        email: "newgoogle@example.com",
        password: expect.any(String),
      });
      expect(signToken).toHaveBeenCalledWith({
        id: 3,
        email: "newgoogle@example.com",
      });
    });

    test("should return 400 if token is missing", async () => {
      const response = await request(app).post("/google-login").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Google token is required"
      );
    });

    test("should return 401 if Google token is invalid", async () => {
      // Mock invalid token
      verifyGoogleToken.mockRejectedValue({
        name: "Unauthorized",
        message: "Invalid Google token",
      });

      const response = await request(app)
        .post("/google-login")
        .send({ token: "invalid_google_token" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid Google token");
    });
  });
});
