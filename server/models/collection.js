"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate(models) {
      // Define association here
      Collection.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  Collection.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "User ID is required",
          },
          notEmpty: {
            msg: "User ID is required",
          },
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Country is required",
          },
          notEmpty: {
            msg: "Country is required",
          },
        },
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Language is required",
          },
          notEmpty: {
            msg: "Language is required",
          },
        },
      },
      theme: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Theme is required",
          },
          notEmpty: {
            msg: "Theme is required",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Collection",
    }
  );
  return Collection;
};
