const {
  collectionAuthorization,
  userAuthorization,
} = require("../../middlewares/authorization");
const { Collection } = require("../../models");

// Mock the models
jest.mock("../../models", () => ({
  Collection: {
    findByPk: jest.fn(),
  },
}));

describe("Authorization Middleware", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("collectionAuthorization", () => {
    test("should call next if user is authorized to access the collection", async () => {
      // Mock data
      const collection = { id: 1, userId: 1 };
      Collection.findByPk.mockResolvedValue(collection);

      // Mock request, response, and next function
      const req = {
        params: { id: "1" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith(1);
      expect(req.collection).toBe(collection);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should return 404 if collection is not found", async () => {
      // Mock collection not found
      Collection.findByPk.mockResolvedValue(null);

      // Mock request, response, and next function
      const req = {
        params: { id: "999" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: `Collection with id 999 is not found`,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should return 403 if user is not authorized to access the collection", async () => {
      // Mock collection found but belongs to different user
      Collection.findByPk.mockResolvedValue({ id: 1, userId: 2 });

      // Mock request, response, and next function
      const req = {
        params: { id: "1" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not authorized to access this resource",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle database errors", async () => {
      // Mock database error
      const dbError = new Error("Database connection failed");
      Collection.findByPk.mockRejectedValue(dbError);

      // Mock request, response, and next function
      const req = {
        params: { id: "1" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("userAuthorization", () => {
    test("should call next if user is authorized", async () => {
      // Mock request, response, and next function
      const req = {
        params: { userId: "1" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("should return 403 if user is not authorized", async () => {
      // Mock request, response, and next function
      const req = {
        params: { userId: "2" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not authorized to access this resource",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle errors correctly", async () => {
      // Mock request with error-causing data
      const req = {
        params: { userId: "invalid" },
        user: { id: 1 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Call the middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
