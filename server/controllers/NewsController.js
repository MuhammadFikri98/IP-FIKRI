const axios = require("axios");
const { Collection } = require("../models");
const { GoogleGenerativeAI } = require("@google/genai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

class NewsController {
  static async getNewsByPreferences(req, res, next) {
    try {
      // Get user's collections instead of preferences
      const collections = await Collection.findAll({
        where: { userId: req.params.userId },
      });

      if (!collections.length) {
        return res
          .status(400)
          .json({ message: "No collections found for this user" });
      }

      // Extract relevant information from collections
      const countries = collections.map((coll) => coll.country);
      const languages = collections.map((coll) => coll.language);
      const themes = collections.map((coll) => coll.theme);

      // Create parameters for World News API
      const country = countries[0]; // Use the first country as default
      const language = languages[0]; // Use the first language as default

      // Convert country name to country code (assuming the first country)
      const countryCode = await getCountryCode(country);

      // Convert language name to language code (assuming the first language)
      const languageCode = await getLanguageCode(language);

      // Fetch news from World News API
      const response = await axios.get(
        "https://api.worldnewsapi.com/top-news",
        {
          params: {
            apiKey: process.env.WORLD_NEWS_API_KEY,
            "source-countries": countryCode || "us",
            language: languageCode || "en",
            number: 30, // Request more articles to allow for better AI filtering
          },
        }
      );

      if (!response.data.news || response.data.news.length === 0) {
        return res.status(404).json({ message: "No news found" });
      }

      // Filter the response to include only the specified attributes
      let articles = response.data.news.map((article) => ({
        title: article.title,
        text: article.text,
        summary: article.summary,
        url: article.url,
        image: article.image,
        publish_date: article.publish_date,
        author: article.author,
        category: article.category,
        source_country: article.source_country,
      }));

      // Use Gemini AI to filter and rank articles based on user preferences
      const relevantArticles = await filterArticlesWithAI(
        articles,
        themes,
        country,
        language
      );

      // Search functionality
      const search = req.query.search;
      if (search) {
        relevantArticles.filteredArticles =
          relevantArticles.filteredArticles.filter(
            (article) =>
              article.title.toLowerCase().includes(search.toLowerCase()) ||
              article.text.toLowerCase().includes(search.toLowerCase()) ||
              article.category.toLowerCase().includes(search.toLowerCase())
          );
      }

      // Filter by category and author
      const category = req.query.category;
      const author = req.query.author;
      if (category) {
        relevantArticles.filteredArticles =
          relevantArticles.filteredArticles.filter(
            (article) =>
              article.category &&
              article.category.toLowerCase() === category.toLowerCase()
          );
      }
      if (author) {
        relevantArticles.filteredArticles =
          relevantArticles.filteredArticles.filter(
            (article) =>
              article.author &&
              article.author.toLowerCase() === author.toLowerCase()
          );
      }

      // Sorting
      const sortBy = req.query.sortBy || "publish_date";
      const order = req.query.order || "desc";
      relevantArticles.filteredArticles.sort((a, b) => {
        if (order === "asc") {
          return new Date(a[sortBy] || 0) - new Date(b[sortBy] || 0);
        } else {
          return new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0);
        }
      });

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedNews = relevantArticles.filteredArticles.slice(
        startIndex,
        endIndex
      );

      res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(relevantArticles.filteredArticles.length / limit),
        totalResults: relevantArticles.filteredArticles.length,
        aiExplanation: relevantArticles.explanation,
        data: paginatedNews,
      });
    } catch (error) {
      console.error("Error in getNewsByPreferences:", error);
      next(error);
    }
  }
}

// Helper function to get country code from country name
async function getCountryCode(countryName) {
  try {
    // Read from the country.json file
    const countries = require("../data/country.json");
    const country = countries.find(
      (c) => c.country.toLowerCase() === countryName.toLowerCase()
    );
    return country ? country.code : "us"; // Default to US if not found
  } catch (error) {
    console.error("Error getting country code:", error);
    return "us"; // Default to US
  }
}

// Helper function to get language code from language name
async function getLanguageCode(languageName) {
  try {
    // Read from the language.json file
    const languages = require("../data/language.json");
    const language = languages.find(
      (l) => l.language.toLowerCase() === languageName.toLowerCase()
    );
    return language ? language.code : "en"; // Default to English if not found
  } catch (error) {
    console.error("Error getting language code:", error);
    return "en"; // Default to English
  }
}

// Function to filter articles using Gemini AI
async function filterArticlesWithAI(articles, themes, country, language) {
  try {
    // Skip AI processing if there are no articles
    if (!articles || articles.length === 0) {
      return {
        filteredArticles: [],
        explanation: "No articles to process",
      };
    }

    // Create a simplified version of articles to reduce token usage
    const simplifiedArticles = articles.map((article, index) => ({
      id: index,
      title: article.title,
      summary: article.summary || article.text?.substring(0, 100) || "",
      category: article.category || "",
    }));

    // Create a prompt for Gemini AI
    const prompt = `
      You are an AI news curator. I need you to analyze these news articles and select ones that are most relevant to a user with the following preferences:
      - Themes of interest: ${themes.join(", ")}
      - Country: ${country}
      - Language: ${language}
      
      Here are ${simplifiedArticles.length} news articles:
      ${JSON.stringify(simplifiedArticles, null, 2)}
      
      Please:
      1. Select up to 20 most relevant articles based on the user's preferences
      2. Rank them by relevance to the user's interests
      3. Provide a brief explanation of why these articles match the user's preferences
      
      Your response should be in JSON format:
      {
        "selectedArticleIds": [article ids in order of relevance],
        "explanation": "Your explanation of the selection process"
      }
    `;

    // Invoke Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Parse the JSON response
    // Extract JSON object from the response (it might be wrapped in markdown code blocks)
    const jsonMatch =
      textResponse.match(/```json\n([\s\S]*?)\n```/) ||
      textResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch
      ? jsonMatch[1] || jsonMatch[0]
      : '{"selectedArticleIds":[], "explanation":"Error parsing AI response"}';

    let aiResponse;
    try {
      aiResponse = JSON.parse(jsonString);
    } catch (e) {
      console.error("Error parsing AI response:", e);
      aiResponse = {
        selectedArticleIds: [],
        explanation: "Error parsing AI response",
      };
    }

    // Get the filtered articles based on AI selection
    const filteredArticles = aiResponse.selectedArticleIds
      .map((id) => articles[id])
      .filter((article) => article); // Filter out any undefined articles

    return {
      filteredArticles:
        filteredArticles.length > 0 ? filteredArticles : articles.slice(0, 10),
      explanation:
        aiResponse.explanation ||
        "AI processed the articles based on your preferences",
    };
  } catch (error) {
    console.error("Error with Gemini AI:", error);
    // Fallback: return original articles if AI fails
    return {
      filteredArticles: articles.slice(0, 10),
      explanation: "AI processing failed, showing default selection",
    };
  }
}

module.exports = NewsController;
