const jwt = require("../../helpers/jwt");

describe("JWT Helper", () => {
  test("should sign a token", () => {
    const payload = { id: 1, email: "test@example.com" };
    const token = jwt.signToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  test("should verify a token", () => {
    const payload = { id: 1, email: "test@example.com" };
    const token = jwt.signToken(payload);

    const decoded = jwt.verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  test("should throw an error for invalid token", () => {
    expect(() => jwt.verifyToken("invalid.token")).toThrow("jwt malformed");
  });
});
