const errorHandler = require("../../middlewares/errorHandler");

describe("Error Handler Middleware", () => {
  test("should handle SequelizeValidationError", () => {
    const err = {
      name: "SequelizeValidationError",
      errors: [{ message: "Validation error" }],
    };
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Validation error" });
  });

  test("should handle SequelizeUniqueConstraintError", () => {
    const err = {
      name: "SequelizeUniqueConstraintError",
      errors: [{ message: "Unique constraint error" }],
    };
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unique constraint error",
    });
  });

  test("should handle generic errors", () => {
    const err = { message: "Something went wrong" };
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });
});
