const GeminiHelper = require("../helpers/gemini");

class GeminiController {
  static async generateContent(req, res, next) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        throw { name: "BadRequest", message: "Prompt is required" };
      }

      const generatedContent = await GeminiHelper.generateContent(prompt);

      res.status(200).json({
        generatedContent,
      });
    } catch (error) {
      next(error);
    }
  }

  static async summarizeNews(req, res, next) {
    try {
      const { newsText } = req.body;

      if (!newsText) {
        throw { name: "BadRequest", message: "News text is required" };
      }

      const summary = await GeminiHelper.summarize(newsText);

      res.status(200).json({
        summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeminiController;
