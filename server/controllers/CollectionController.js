const { Collection } = require("../models");

class CollectionController {
  static async create(req, res, next) {
    try {
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
      const collections = await Collection.findAll({ where: { userId } });
      res.status(200).json(collections);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      console.log("masuk");

      const collectionId = +req.params.id;
      console.log(collectionId);

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
