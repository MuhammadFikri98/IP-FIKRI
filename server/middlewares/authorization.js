const { Collection } = require("../models");

async function collectionAuthorization(req, res, next) {
  try {
    const collectionId = +req.params.id;

    // Find the collection by ID
    const collection = await Collection.findByPk(collectionId);

    if (!collection) {
      return res.status(404).json({
        message: `Collection with id ${collectionId} is not found`,
      });
    }

    // Check if the collection belongs to the logged-in user
    if (collection.userId !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to access this resource",
      });
    }

    // Add collection to request object for later use if needed
    req.collection = collection;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function userAuthorization(req, res, next) {
  try {
    const userId = +req.params.userId;

    // Check if the user is trying to access their own collections
    if (userId !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to access this resource",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = { collectionAuthorization, userAuthorization };
