// This test specifically targets line 46 in authorization.js (error handling in userAuthorization)
const { userAuthorization } = require("../../middlewares/authorization");

describe("Authorization Middleware - Edge Cases", () => {
  test("userAuthorization should handle non-numeric userId parameter", async () => {
    // Create a request with non-numeric userId that will cause an error in the parseInt
    const req = {
      params: { userId: "not-a-number" },
      user: { id: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    // Call the middleware which should trigger the error path
    await userAuthorization(req, res, next);

    // This should go to the catch block (line 46)
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
