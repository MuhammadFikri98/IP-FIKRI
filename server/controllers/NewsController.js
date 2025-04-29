const axios = require("axios");
const { Collection } = require("../models");
const GeminiHelper = require("../helpers/gemini");
const DataLoader = require("../helpers/dataLoader");

class NewsController {
  static async getRecommendedNews(req, res, next) {
    try {
      const userId = req.user.id;
      console.log("User ID:", userId);

      // Get user's collections to determine their preferences
      const collections = await Collection.findAll({ where: { userId } });
      console.log("Collections found:", collections.length);

      if (!collections.length) {
        throw {
          name: "BadRequest",
          message:
            "You need to create collections first to get personalized news recommendations",
        };
      }

      // Get the most recently added collection for recommendations
      const latestCollection = collections[collections.length - 1];
      console.log("Latest collection:", JSON.stringify(latestCollection));

      // Make sure we have all the required collection properties
      if (
        !latestCollection.country ||
        !latestCollection.language ||
        !latestCollection.theme
      ) {
        throw {
          name: "BadRequest",
          message:
            "Your collection is missing required information (country, language, or theme)",
        };
      }

      const { country, language, theme } = latestCollection;

      // Get country code from the country name in collection - FIX: Gunakan static method dengan nama class
      const countryCode = NewsController.getCountryCode(country);
      console.log("Country code:", countryCode);

      // Get language code from the language name in collection - FIX: Gunakan static method dengan nama class
      const languageCode = NewsController.getLanguageCode(language);
      console.log("Language code:", languageCode);

      // Fetch news from WorldNews API
      const apiKey = process.env.WORLD_NEWS_API_KEY;

      if (!apiKey) {
        throw {
          name: "BadRequest",
          message: "WorldNews API key is not configured",
        };
      }

      // Coba dengan parameter API yang berbeda (sesuai dokumentasi)
      const apiUrl = `https://api.worldnewsapi.com/search-news?source-countries=${countryCode}&language=${languageCode}&api-key=${apiKey}&number=10`;

      console.log("API URL:", apiUrl);

      try {
        const response = await axios.get(apiUrl);
        console.log("API Response status:", response.status);
        console.log("API Response data keys:", Object.keys(response.data));

        // Periksa bentuk respons API, sesuaikan dengan struktur API WorldNews yang sebenarnya
        const newsArticles = response.data.news || [];

        // Safely handle empty news array
        if (newsArticles.length === 0) {
          return res.status(200).json({
            news: [],
            message: "No news found for your preferences",
            userPreferences: { country, language, theme },
          });
        }

        // Use Gemini to enhance the recommendation with the theme - with better error handling
        let aiRecommendation = "";
        try {
          const articlesData = newsArticles.map((n, index) => {
            return {
              index,
              title: n.title || "No title",
              summary:
                n.summary ||
                (n.text ? n.text.substring(0, 150) : "No summary available"),
            };
          });

          const prompt = `Based on a user's interest in "${theme}" news from ${country} in ${language}, 
                          which of these news articles would be most relevant? 
                          Respond with the indexes of the top 3 most relevant articles (0-based index) and a brief explanation why.
                          Articles: ${JSON.stringify(articlesData)}`;

          // Get AI recommendation
          aiRecommendation = await GeminiHelper.generateContent(prompt);
        } catch (error) {
          console.error("Error generating AI recommendation:", error);
          aiRecommendation =
            "Unable to generate AI recommendation at this time.";
        }

        // Return both all news and AI recommendation
        return res.status(200).json({
          news: newsArticles,
          aiRecommendation,
          userPreferences: {
            country,
            language,
            theme,
          },
        });
      } catch (apiError) {
        console.error("WorldNews API Error:", apiError.message);
        if (apiError.response) {
          console.error("API Error Status:", apiError.response.status);
          console.error("API Error Data:", apiError.response.data);
        }

        throw {
          name: "BadRequest",
          message: `Error fetching news: ${
            apiError.message || "Unknown error"
          }`,
        };
      }
    } catch (error) {
      console.error("News recommendation error:", error);
      next(error);
    }
  }

  // Helper method to get country code from country name
  static getCountryCode(countryName) {
    if (!countryName) return "us"; // Default to US if no country name provided
    const countryMap = DataLoader.loadCountryMap();
    return countryMap[countryName] || "us"; // Default to US if not found
  }

  // Helper method to get language code from language name
  static getLanguageCode(languageName) {
    if (!languageName) return "en"; // Default to English if no language name provided
    const languageMap = DataLoader.loadLanguageMap();
    return languageMap[languageName] || "en"; // Default to English if not found
  }
}

module.exports = NewsController;
