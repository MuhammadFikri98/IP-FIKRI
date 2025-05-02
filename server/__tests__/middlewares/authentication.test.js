const authentication = require("../../middlewares/authentication");

describe("Authentication Middleware", () => {
  test("should call next if token is valid", () => {
    const req = { headers: { authorization: "Bearer valid_token" } };
    const res = {};
    const next = jest.fn();

    jest
      .spyOn(require("../../helpers/jwt"), "verifyToken")
      .mockReturnValue({ id: 1 });

    authentication(req, res, next);

    expect(req.user).toEqual({ id: 1 });
    expect(next).toHaveBeenCalled();
  });

  test("should return 401 if token is missing", () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authentication(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Authentication failed" });
  });

  test("should return 401 if token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalid_token" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    jest
      .spyOn(require("../../helpers/jwt"), "verifyToken")
      .mockImplementation(() => {
        throw new Error("Invalid token");
      });

    authentication(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Authentication failed" });
  });
});
