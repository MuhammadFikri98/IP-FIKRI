const request = require("supertest");
const app = require("../../app");
const { User } = require("../../models");
const { hashPassword } = require("../../helpers/bcrypt");

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    await User.destroy({
      where: { email: "register@mail.com" },
    });
  });

  describe("POST /register", () => {
    test("Should register a new user successfully", async () => {
      const newUser = {
        email: "register@mail.com",
        password: "password123",
      };

      const response = await request(app).post("/register").send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email", newUser.email);
    });

    test("Should fail to register a user with existing email", async () => {
      const existingUser = {
        email: "register@mail.com",
        password: "password123",
      };

      const response = await request(app).post("/register").send(existingUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email already exists");
    });

    test("Should fail to register a user with invalid email format", async () => {
      const invalidUser = {
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app).post("/register").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email format is wrong");
    });

    test("Should fail to register a user with short password", async () => {
      const shortPasswordUser = {
        email: "valid@mail.com",
        password: "1234",
      };

      const response = await request(app)
        .post("/register")
        .send(shortPasswordUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Password at least 5 characters"
      );
    });
  });

  describe("POST /login", () => {
    beforeAll(async () => {
      // Clear existing test user if any
      await User.destroy({
        where: { email: "login@mail.com" },
      });

      // Create a new test user with known credentials
      await User.create({
        email: "login@mail.com",
        password: "password123", // This will be hashed by the beforeCreate hook
      });
    });

    test("Should login successfully with valid credentials", async () => {
      const loginData = {
        email: "login@mail.com",
        password: "password123",
      };

      const response = await request(app).post("/login").send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
    });

    test("Should fail to login with incorrect password", async () => {
      const wrongPassword = {
        email: "login@mail.com",
        password: "wrongpassword",
      };

      const response = await request(app).post("/login").send(wrongPassword);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid email/password");
    });

    test("Should fail to login with non-existent email", async () => {
      const nonExistentUser = {
        email: "nonexistent@mail.com",
        password: "password123",
      };

      const response = await request(app).post("/login").send(nonExistentUser);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid email/password");
    });

    test("Should fail to login with missing email", async () => {
      const missingEmail = {
        password: "password123",
      };

      const response = await request(app).post("/login").send(missingEmail);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Email is required");
    });

    test("Should fail to login with missing password", async () => {
      const missingPassword = {
        email: "login@mail.com",
      };

      const response = await request(app).post("/login").send(missingPassword);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Password is required");
    });
  });
});
