const {
  collectionAuthorization,
  userAuthorization,
} = require("../../middlewares/authorization");
const { Collection } = require("../../models");

// Mock Collection model
jest.mock("../../models", () => ({
  Collection: {
    findByPk: jest.fn(),
  },
}));

describe("Authorization Middleware - Complete Coverage", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup req, res, next
    req = {
      params: {},
      userId: 1, // Authenticated user ID from authentication middleware
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("collectionAuthorization middleware", () => {
    test("should allow access to owner of the collection", async () => {
      // Setup request
      req.params.id = "1";

      // Mock collection in database
      const mockCollection = {
        id: 1,
        userId: 1,
        theme: "Technology",
      };
      Collection.findByPk.mockResolvedValue(mockCollection);

      // Call middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith("1");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should deny access to users who do not own the collection", async () => {
      // Setup request
      req.params.id = "1";
      req.userId = 2; // Different user

      // Mock collection in database
      const mockCollection = {
        id: 1,
        userId: 1,
        theme: "Technology",
      };
      Collection.findByPk.mockResolvedValue(mockCollection);

      // Call middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith("1");
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Forbidden"),
        })
      );
    });

    test("should return 404 if collection not found", async () => {
      // Setup request
      req.params.id = "999";

      // Mock collection not found
      Collection.findByPk.mockResolvedValue(null);

      // Call middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith("999");
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("not found"),
        })
      );
    });

    test("should handle database errors", async () => {
      // Setup request
      req.params.id = "1";

      // Mock database error
      const dbError = new Error("Database error");
      Collection.findByPk.mockRejectedValue(dbError);

      // Call middleware
      await collectionAuthorization(req, res, next);

      // Assertions
      expect(Collection.findByPk).toHaveBeenCalledWith("1");
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("userAuthorization middleware", () => {
    test("should allow user to access their own resources", async () => {
      // Setup request
      req.params.userId = "1";
      req.userId = 1;

      // Call middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should deny access to other users resources", async () => {
      // Setup request
      req.params.userId = "2";
      req.userId = 1;

      // Call middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Forbidden"),
        })
      );
    });

    test("should handle missing userId in params", async () => {
      // Setup request - missing userId
      req.params = {};

      // Call middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("User ID is required"),
        })
      );
    });

    test("should handle errors", async () => {
      // Setup request to trigger error
      req.params.userId = "1";
      req.userId = 1;

      // Setup next to throw error when called
      next.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Call middleware
      await userAuthorization(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Internal Server Error"),
        })
      );
    });
  });
});
