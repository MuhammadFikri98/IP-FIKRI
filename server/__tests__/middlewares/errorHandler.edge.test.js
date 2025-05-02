// This test targets the specific uncovered lines in errorHandler.js (lines 14, 22, 26)
const errorHandler = require("../../middlewares/errorHandler");

describe("Error Handler Middleware - Edge Cases", () => {
  // Test for line 14 (SequelizeValidationError with empty errors array)
  test("should handle SequelizeValidationError with empty errors array", () => {
    const err = {
      name: "SequelizeValidationError",
      errors: [], // Empty errors array
    };

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "" }); // Empty message due to empty errors
  });

  // Test for line 22 (SequelizeUniqueConstraintError with empty errors array)
  test("should handle SequelizeUniqueConstraintError with empty errors array", () => {
    const err = {
      name: "SequelizeUniqueConstraintError",
      errors: [], // Empty errors array
    };

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "" }); // Empty message due to empty errors
  });

  // Test for line 26 (error without name)
  test("should handle error without name property", () => {
    const err = {
      // No name property
      message: "Some error message",
    };

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500); // Default to 500
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });
});
