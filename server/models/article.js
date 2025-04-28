'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Article.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "title is required",
          },
          notEmpty: {
            msg: "title is required",
          },
        },
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "text is required",
          },
          notEmpty: {
            msg: "text is required",
          },
        },
      },
      summary: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "summary is required",
          },
          notEmpty: {
            msg: "summary is required",
          },
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "url is required",
          },
          notEmpty: {
            msg: "url is required",
          },
        },
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "image is required",
          },
          notEmpty: {
            msg: "image is required",
          },
        },
      },
      publish_date: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "publish date is required",
          },
          notEmpty: {
            msg: "publish date is required",
          },
        },
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "author is required",
          },
          notEmpty: {
            msg: "author is required",
          },
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "category is required",
          },
          notEmpty: {
            msg: "category is required",
          },
        },
      },
      source_country: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "source country is required",
          },
          notEmpty: {
            msg: "source country is required",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Article",
    }
  );
  return Article;
};