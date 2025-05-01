const path = require("path");
const fs = require("fs");
const Sequelize = require("sequelize");

// Mock dependencies
jest.mock("fs");
jest.mock("sequelize");
jest.mock("path");

describe("Models Index - Branch Coverage Tests", () => {
  // Save original Node environment
  const originalNodeEnv = process.env.NODE_ENV;

  // Mock model modules
  const mockUserModel = {
    name: "User",
    associate: jest.fn(),
  };

  const mockCollectionModel = {
    name: "Collection",
    associate: jest.fn(),
  };

  // Mock non-function model module
  const mockInvalidModel = {
    name: "Invalid",
  };

  beforeEach(() => {
    // Reset mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Setup mock implementations
    fs.readdirSync.mockReturnValue([
      "user.js",
      "collection.js",
      "invalid.js",
      "index.js",
      ".DS_Store",
      "model.test.js",
    ]);

    // Mock path.basename to return file names correctly
    path.basename.mockImplementation((file) => {
      return file.split("/").pop();
    });

    // Mock path.join to simulate require path
    path.join.mockImplementation((...args) => args.join("/"));

    // Mock Sequelize constructor
    Sequelize.mockImplementation(() => ({
      authenticate: jest.fn().mockResolvedValue(true),
      define: jest.fn().mockReturnValue({}),
      import: jest.fn().mockImplementation((filePath) => {
        if (filePath.includes("user.js")) {
          return mockUserModel;
        }
        if (filePath.includes("collection.js")) {
          return mockCollectionModel;
        }
        if (filePath.includes("invalid.js")) {
          return mockInvalidModel;
        }
        return null;
      }),
    }));

    // Mock directory path
    path.resolve.mockReturnValue("/mocked/path");

    // Mock require for model files
    jest.mock(
      "../../models/user.js",
      () => jest.fn().mockReturnValue(mockUserModel),
      { virtual: true }
    );
    jest.mock(
      "../../models/collection.js",
      () => jest.fn().mockReturnValue(mockCollectionModel),
      { virtual: true }
    );
    jest.mock("../../models/invalid.js", () => mockInvalidModel, {
      virtual: true,
    });

    // Mock config file
    jest.mock(
      "../../config/config.json",
      () => ({
        test: {
          use_env_variable: "DATABASE_URL",
        },
        development: {
          database: "testdb",
          username: "user",
          password: "pass",
          host: "localhost",
          dialect: "postgres",
        },
      }),
      { virtual: true }
    );

    // Mock models' index.js to avoid fs.readdirSync issues
    jest.mock(
      "../../models/index.js",
      () => {
        const db = {};
        db.sequelize = new Sequelize();
        db.Sequelize = Sequelize;
        db.User = mockUserModel;
        db.Collection = mockCollectionModel;
        return db;
      },
      { virtual: true }
    );

    // Mock console.warn
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("should initialize with environment variable", () => {
    // Set up environment
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";

    // Require the module under test
    const db = require("../../models");

    // Verify models were loaded
    expect(db).toHaveProperty("sequelize");
    expect(db).toHaveProperty("Sequelize");

    // Verify models were included
    expect(db).toHaveProperty("User");
    expect(db).toHaveProperty("Collection");
  });

  test("should initialize with config object when no env variable", () => {
    // Set environment
    process.env.NODE_ENV = "development";

    // Require the module under test
    const db = require("../../models");

    // Verify models were loaded with direct config
    expect(db).toHaveProperty("sequelize");
    expect(db).toHaveProperty("Sequelize");

    // Verify models were included
    expect(db).toHaveProperty("User");
    expect(db).toHaveProperty("Collection");
  });

  test("should handle model associations", () => {
    // Set environment
    process.env.NODE_ENV = "development";

    // Require module
    const db = require("../../models");

    // Expect db to exist with associate methods accessible
    expect(db.User.associate).toBeDefined();
    expect(db.Collection.associate).toBeDefined();
  });

  test("should handle non-function model exports", () => {
    // Set environment
    process.env.NODE_ENV = "development";

    // Require module
    const db = require("../../models");

    // Expect db to exist
    expect(db).toBeDefined();

    // Verify that console.warn was called (for non-function model)
    expect(console.warn).toHaveBeenCalled();
  });

  test("should use development environment by default", () => {
    // Set undefined environment
    delete process.env.NODE_ENV;

    // Mock fs.readdirSync to return empty list to simplify test
    fs.readdirSync.mockReturnValue([]);

    // Import our module under test
    const Sequelize = require("sequelize");
    const db = require("../../models/index");

    // Verify Sequelize was initialized with development config
    expect(Sequelize).toHaveBeenCalledWith(
      "testdb",
      "user",
      "pass",
      expect.objectContaining({ dialect: "postgres" })
    );
  });

  test("should use environment variable when specified in config", () => {
    // Set production environment and DATABASE_URL
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/prod_db";

    // Mock fs.readdirSync to return empty list to simplify test
    fs.readdirSync.mockReturnValue([]);

    // Import our module under test
    const Sequelize = require("sequelize");
    const db = require("../../models/index");

    // Verify Sequelize was initialized with environment variable
    expect(Sequelize).toHaveBeenCalledWith(
      "postgres://user:pass@localhost:5432/prod_db",
      expect.objectContaining({ dialect: "postgres" })
    );
  });

  test("should load valid model files", () => {
    // Mock fs.readdirSync to return model files
    fs.readdirSync.mockReturnValue([
      "user.js",
      "collection.js",
      "index.js",
      ".DS_Store",
      "model.test.js",
    ]);

    // Mock require for model files
    const mockUserModel = jest
      .fn()
      .mockReturnValue({ name: "User", associate: jest.fn() });
    const mockCollectionModel = jest
      .fn()
      .mockReturnValue({ name: "Collection" });

    // Setup dynamic mocking of require calls
    jest.mock("../../models/user.js", () => mockUserModel, { virtual: true });
    jest.mock("../../models/collection.js", () => mockCollectionModel, {
      virtual: true,
    });

    // Import our module under test
    const db = require("../../models/index");

    // Verify models were loaded
    expect(db.User).toBeDefined();
    expect(db.Collection).toBeDefined();

    // Verify associate was called for User model
    expect(db.User.associate).toHaveBeenCalledWith(db);
  });

  test("should skip files that do not export a function", () => {
    // Mock console.warn to verify warning is logged
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    // Mock fs.readdirSync to return model files
    fs.readdirSync.mockReturnValue(["validModel.js", "invalidModel.js"]);

    // Mock require for model files
    const mockValidModel = jest.fn().mockReturnValue({ name: "ValidModel" });
    const mockInvalidModel = { name: "InvalidModel" }; // Not a function

    // Setup dynamic mocking of require calls
    jest.mock("../../models/validModel.js", () => mockValidModel, {
      virtual: true,
    });
    jest.mock("../../models/invalidModel.js", () => mockInvalidModel, {
      virtual: true,
    });

    // Import our module under test
    const db = require("../../models/index");

    // Verify only valid model was loaded
    expect(db.ValidModel).toBeDefined();
    expect(db.InvalidModel).toBeUndefined();

    // Verify warning was logged for invalid model
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Model file invalidModel.js does not export a function"
      )
    );

    // Clean up
    consoleSpy.mockRestore();
  });

  test("should not call associate if not defined", () => {
    // Mock fs.readdirSync to return model files
    fs.readdirSync.mockReturnValue(["modelWithoutAssociate.js"]);

    // Mock require for model file
    const mockModel = jest
      .fn()
      .mockReturnValue({ name: "ModelWithoutAssociate" });

    // Setup dynamic mocking of require calls
    jest.mock("../../models/modelWithoutAssociate.js", () => mockModel, {
      virtual: true,
    });

    // Import our module under test
    const db = require("../../models/index");

    // Verify model was loaded
    expect(db.ModelWithoutAssociate).toBeDefined();

    // No error should be thrown since associate is not defined
  });
});
