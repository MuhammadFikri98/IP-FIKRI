const bcrypt = require("../../helpers/bcrypt");

describe("Bcrypt Helper", () => {
  test("should hash a password", async () => {
    const password = "password123";
    const hashedPassword = await bcrypt.hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
  });

  test("should compare a password correctly", async () => {
    const password = "password123";
    const hashedPassword = await bcrypt.hashPassword(password);

    const isMatch = await bcrypt.comparePassword(password, hashedPassword);
    expect(isMatch).toBe(true);

    const isNotMatch = await bcrypt.comparePassword(
      "wrongpassword",
      hashedPassword
    );
    expect(isNotMatch).toBe(false);
  });
});
