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

      // Get country code from the country name in collection
      const countryCode = NewsController.getCountryCode(country);
      console.log("Country code:", countryCode);

      // Get language code from the language name in collection
      const languageCode = NewsController.getLanguageCode(language);
      console.log("Language code:", languageCode);

      // Fetch news from WorldNews API
      const apiKey = process.env.WORLD_NEWS_API_KEY;

      if (!apiKey) {
        console.log("API key not configured, using mock data");
        return res.status(200).json({
          news: NewsController.generateMockNews(country, language, theme),
          message: "Using demo data (API key not configured)",
          userPreferences: { country, language, theme },
        });
      }

      // Try with different API parameters (according to documentation)
      const apiUrl = `https://api.worldnewsapi.com/search-news?source-countries=${countryCode}&language=${languageCode}&api-key=${apiKey}&number=10`;

      console.log("API URL:", apiUrl);

      try {
        const response = await axios.get(apiUrl);
        console.log("API Response status:", response.status);
        console.log("API Response data keys:", Object.keys(response.data));

        // Check the form of the API response, adjust according to the actual WorldNews API structure
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

        // Check if the error is a payment required error (402)
        if (apiError.response && apiError.response.status === 402) {
          console.log("Payment required error (402), using mock data instead");
          return res.status(200).json({
            news: NewsController.generateMockNews(country, language, theme),
            message: "Using demo data (API requires payment)",
            userPreferences: { country, language, theme },
          });
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

  // Generate mock news data for demo purposes
  static generateMockNews(country, language, theme) {
    // Get country name from code if it's a code
    let countryName = country;
    if (country.length === 2) {
      const countriesData = DataLoader.loadCountryData();
      const foundCountry = countriesData.find((c) => c.code === country);
      if (foundCountry) {
        countryName = foundCountry.country;
      }
    }

    // Get language name from code if it's a code
    let languageName = language;
    if (language.length === 2) {
      const languagesData = DataLoader.loadLanguageData();
      const foundLanguage = languagesData.find((l) => l.code === language);
      if (foundLanguage) {
        languageName = foundLanguage.language;
      }
    }

    return [
      {
        title: `${theme} News: Major Developments in ${countryName}`,
        description: `Recent developments in ${theme} are making headlines across ${countryName}. This article covers the most important updates in ${languageName}.`,
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=News+Image",
        publishedAt: new Date().toISOString(),
        source: { name: "NEWS GenAI Demo" },
        country: country,
        language: language,
        summary: `This is a demonstration article about ${theme} in ${countryName}. The real API service requires payment or has exceeded its free usage limits.`,
      },
      {
        title: `${countryName}'s Approach to ${theme} Creates Global Interest`,
        description: `Experts worldwide are discussing ${countryName}'s innovative approach to ${theme}. Read the analysis and commentary from leading specialists.`,
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=Analysis+Image",
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
        source: { name: "Global Analysis" },
        country: country,
        language: language,
        summary: `A detailed analysis of ${theme} developments in ${countryName} and their global implications. This is demonstration content.`,
      },
      {
        title: `Interview: Leading Expert Discusses ${theme} Trends`,
        description: `An exclusive interview with a leading expert in ${theme} discussing current trends and future predictions, particularly relevant to ${countryName}.`,
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=Interview+Image",
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        source: { name: "Expert Insights" },
        country: country,
        language: language,
        summary: `Insights from industry leaders about the future of ${theme}, with special focus on ${countryName}. Demo content only.`,
      },
      {
        title: `Historical Context: ${theme} in ${countryName} Over the Decades`,
        description: `A look back at how ${theme} has evolved in ${countryName} over recent decades and what these changes mean for today's society.`,
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=History+Image",
        publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        source: { name: "Historical Review" },
        country: country,
        language: language,
        summary: `Exploring the historical progression of ${theme} in ${countryName} and its impact on modern developments. This is demonstration content.`,
      },
    ];
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
