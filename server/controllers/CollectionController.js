const { Collection } = require("../models");

class CollectionController {
  static async create(req, res, next) {
    try {
      // Validate required fields
      if (!req.body || Object.keys(req.body).length === 0) {
        throw {
          name: "BadRequest",
          message: "Required fields are missing",
        };
      }

      const newBody = { ...req.body };
      newBody.userId = req.user.id; // Automatically assign userId from authenticated user

      const collection = await Collection.create(newBody);

      res.status(201).json(collection);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(+userId)) {
        throw {
          name: "BadRequest",
          message: "Invalid user ID format",
        };
      }

      const collections = await Collection.findAll({ where: { userId } });
      res.status(200).json(collections);
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      const collectionId = +req.params.id;

      // Validate collectionId
      if (!collectionId || isNaN(collectionId)) {
        throw {
          name: "BadRequest",
          message: "Invalid collection ID format",
        };
      }

      const collection = await Collection.findByPk(collectionId);

      if (!collection) {
        throw {
          name: "NotFound",
          message: `Collection with id ${collectionId} is not found`,
        };
      }

      res.status(200).json(collection);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const collectionId = +req.params.id;

      // Validate collectionId
      if (!collectionId || isNaN(collectionId)) {
        throw {
          name: "BadRequest",
          message: "Invalid collection ID format",
        };
      }

      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        throw {
          name: "BadRequest",
          message: "No fields provided for update",
        };
      }

      const collection = await Collection.findByPk(collectionId);

      if (!collection) {
        throw {
          name: "NotFound",
          message: `Collection with id ${collectionId} is not found`,
        };
      }

      await collection.update(req.body);

      res.status(200).json({
        message: "Collection updated successfully",
        collection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const collectionId = +req.params.id;

      // Validate collectionId
      if (!collectionId || isNaN(collectionId)) {
        throw {
          name: "BadRequest",
          message: "Invalid collection ID format",
        };
      }

      const collection = await Collection.findByPk(collectionId);
      if (!collection) {
        throw {
          name: "NotFound",
          message: `Collection with id ${collectionId} is not found`,
        };
      }

      await collection.destroy();
      res.status(200).json({
        message: "Collection deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CollectionController;
