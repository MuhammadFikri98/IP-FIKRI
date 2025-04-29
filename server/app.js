if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const authentication = require("./middlewares/authentication");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const axios = require("axios");
const {
  collectionAuthorization,
  userAuthorization,
} = require("./middlewares/authorization");

const AuthController = require("./controllers/AuthController");
const CollectionController = require("./controllers/CollectionController");
const GeminiController = require("./controllers/GeminiController");

//cors
app.use(cors());
// middleware body-parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Register Endpoint
app.post("/register", AuthController.register);

// Login Endpoint
app.post("/login", AuthController.login);

// Protected Routes
app.use(authentication);

// Collection Routes
app.post("/collections", CollectionController.create);
app.get(
  "/users/:userId/collections",
  userAuthorization,
  CollectionController.findAll
);
app.put(
  "/collections/:id",
  collectionAuthorization,
  CollectionController.update
);
app.delete(
  "/collections/:id",
  collectionAuthorization,
  CollectionController.delete
);

// Gemini API Routes
app.post("/gemini/generate", GeminiController.generateContent);
app.post("/gemini/summarize", GeminiController.summarizeNews);

// Error Handler Middleware
app.use(errorHandler);

module.exports = app;
