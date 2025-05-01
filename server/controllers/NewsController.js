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

      // Get country and language codes
      const countryCode = NewsController.getCountryCode(country);
      const languageCode = NewsController.getLanguageCode(language);
      const countryName = NewsController.getCountryName(country);
      const languageName = NewsController.getLanguageName(language);

      console.log(
        `Fetching ${theme} news from ${countryName} in ${languageName}`
      );

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

      // Build optimized query for the WorldNews API
      const apiUrl = NewsController.buildNewsApiUrl(
        apiKey,
        countryCode,
        languageCode,
        theme
      );
      console.log("API URL:", apiUrl);

      try {
        // Fetch data from API
        const response = await axios.get(apiUrl);
        console.log(
          `API Response: ${response.status}, found ${
            response.data.news?.length || 0
          } articles`
        );

        // Process response data
        const newsArticles = response.data.news || [];
        if (newsArticles.length === 0) {
          return res.status(200).json({
            news: [],
            message: "No news found for your preferences",
            userPreferences: { country, language, theme },
          });
        }

        // Transform API data to application format
        const processedArticles = NewsController.processNewsArticles(
          newsArticles,
          countryCode,
          languageCode,
          countryName
        );

        // Generate AI recommendation
        const aiRecommendation = await NewsController.generateAIRecommendation(
          processedArticles,
          countryName,
          languageName,
          theme,
          countryCode,
          languageCode,
          response.data.demo || !apiKey
        );

        // Return processed data to client
        return res.status(200).json({
          news: processedArticles,
          aiRecommendation,
          userPreferences: { country, language, theme },
        });
      } catch (apiError) {
        console.error("WorldNews API Error:", apiError.message);
        if (apiError.response) {
          console.error("API Error Status:", apiError.response.status);
          console.error("API Error Data:", apiError.response.data);
        }

        // Use mock data for API errors or payment required responses
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

  // Build optimized WorldNews API URL with all parameters
  static buildNewsApiUrl(apiKey, countryCode, languageCode, theme) {
    // Base URL and required parameters
    const baseUrl = "https://api.worldnewsapi.com/search-news";

    // Build query parameters
    const params = new URLSearchParams({
      "api-key": apiKey,
      language: languageCode,
      "source-countries": countryCode,
      number: 10, // Number of articles to return
      sort: "publish-time", // Get the latest news
      "sort-direction": "desc", // Newest first
    });

    // Add theme as a search query
    if (theme) {
      params.append("text", theme);
    }

    // Add additional useful parameters for better results
    if (
      theme.toLowerCase().includes("business") ||
      theme.toLowerCase().includes("economy")
    ) {
      params.append(
        "earliest-publish-date",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      ); // 1 week
    } else {
      params.append(
        "earliest-publish-date",
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      ); // 3 days
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Process and transform API response to application format
  static processNewsArticles(
    newsArticles,
    countryCode,
    languageCode,
    countryName
  ) {
    return newsArticles.map((article) => {
      return {
        title: article.title,
        description: article.text?.substring(0, 150) || article.summary || "",
        url: article.url,
        urlToImage:
          article.image || "https://via.placeholder.com/600x400?text=No+Image",
        publishedAt: article.publish_date,
        source: {
          name: article.source_country || article.source || countryName,
        },
        country: countryCode,
        language: languageCode,
        summary: article.summary || article.text?.substring(0, 200) || "",
        // Include additional fields from WorldNewsAPI if available
        author: article.author,
        sentiment: article.sentiment,
        categories: article.categories,
      };
    });
  }

  // Generate AI recommendation based on articles and preferences
  static async generateAIRecommendation(
    articles,
    countryName,
    languageName,
    theme,
    countryCode,
    languageCode,
    useMockData = false
  ) {
    try {
      // Create article data for AI processing
      const articlesData = articles
        .map((n, index) => ({
          index,
          title: n.title || "No title",
          summary:
            n.summary ||
            n.description?.substring(0, 150) ||
            "No summary available",
          source: n.source?.name || "Unknown source",
          publishedAt: n.publishedAt || "Unknown date",
          country: n.country || countryCode,
          language: n.language || languageCode,
          url: n.url,
          // Include WorldNewsAPI specific fields if available
          sentiment: n.sentiment,
          categories: n.categories,
          author: n.author,
        }))
        .filter((a) =>
          Object.values(a).some(
            (v) => v !== null && v !== undefined && v !== ""
          )
        );

      // Check for theme relevance
      const themeKeywords = theme.toLowerCase().split(/\s+/);
      const themeRelevantArticles = articlesData.filter((article) => {
        const title = article.title?.toLowerCase() || "";
        const summary = article.summary?.toLowerCase() || "";
        const url = article.url?.toLowerCase() || "";
        const categories = Array.isArray(article.categories)
          ? article.categories.join(" ").toLowerCase()
          : "";

        return themeKeywords.some(
          (keyword) =>
            title.includes(keyword) ||
            summary.includes(keyword) ||
            url.includes(keyword) ||
            categories.includes(keyword)
        );
      });

      // Use appropriate prompt based on theme relevance
      let prompt;
      if (themeRelevantArticles.length === 0) {
        prompt = NewsController.buildNonMatchingThemePrompt(
          countryName,
          countryCode,
          languageName,
          languageCode,
          theme,
          articlesData
        );
      } else {
        prompt = NewsController.buildMatchingThemePrompt(
          countryName,
          countryCode,
          languageName,
          languageCode,
          theme,
          articlesData
        );
      }

      // Get recommendation from AI or use mock data
      let aiRecommendation;
      if (useMockData) {
        aiRecommendation = NewsController.generateMockRecommendation(
          countryName,
          languageName,
          theme,
          articles
        );
      } else {
        aiRecommendation = await GeminiHelper.generateContent(prompt);

        // Try simpler prompt if AI fails
        if (
          aiRecommendation.includes("Unable to generate") ||
          aiRecommendation.includes("unavailable")
        ) {
          console.log("Retrying with simpler prompt");
          const simplePrompt = `Recommend 3 news articles about ${theme} from this list:\n${articlesData
            .map((a) => `${a.index}: ${a.title}`)
            .join("\n")}`;
          aiRecommendation = await GeminiHelper.generateContent(simplePrompt);
        }

        // Fall back to mock if all else fails
        if (
          !aiRecommendation ||
          aiRecommendation.includes("Unable to generate")
        ) {
          aiRecommendation = NewsController.generateMockRecommendation(
            countryName,
            languageName,
            theme,
            articles
          );
        }
      }

      return aiRecommendation;
    } catch (error) {
      console.error("Error generating AI recommendation:", error);
      // Fall back to mock recommendation
      return NewsController.generateMockRecommendation(
        countryName,
        languageName,
        theme,
        articles
      );
    }
  }

  // Build prompt for when articles match the requested theme
  static buildMatchingThemePrompt(
    countryName,
    countryCode,
    languageName,
    languageCode,
    theme,
    articlesData
  ) {
    return `As a news recommendation system, suggest articles about "${theme}" from ${countryName} in ${languageName}.

USER PREFERENCES:
- Country: ${countryName} (${countryCode})
- Language: ${languageName} (${languageCode}) 
- Theme: ${theme}

AVAILABLE ARTICLES:
${JSON.stringify(articlesData, null, 2)}

FORMAT YOUR RESPONSE:
# Personalized News Recommendations

Here are articles selected for your interest in ${theme} news from ${countryName} in ${languageName}.

## Top Recommendations

For each article (3-5), include:
- Article #[index]: [title]
- Why it's relevant to your ${theme} interest
- How it connects to ${countryName} and ${languageName}

## Summary
One sentence explaining how these articles match your preferences.`;
  }

  // Build prompt for when articles don't match the requested theme
  static buildNonMatchingThemePrompt(
    countryName,
    countryCode,
    languageName,
    languageCode,
    theme,
    articlesData
  ) {
    return `As a news recommendation system, I need your help with a situation.

USER PREFERENCES:
- Country: ${countryName} (${countryCode})
- Language: ${languageName} (${languageCode}) 
- Theme: ${theme}

SITUATION:
The available articles don't seem to match the user's theme preference (${theme}). Please create a response that:
1. Acknowledges this mismatch
2. Still recommends 2-3 of the most interesting articles from what's available
3. Explains why you're recommending these despite the theme mismatch

AVAILABLE ARTICLES:
${JSON.stringify(articlesData, null, 2)}

FORMAT YOUR RESPONSE:
# Personalized News Recommendations

Here are the latest news articles from ${countryName} in ${languageName}, though they may not directly match your ${theme} interests.

## Available Recommendations

For each article (2-3), include:
- Article #[index]: [title]
- Brief description of what this article is about
- Why it might still be interesting despite not being about ${theme}

## Note about your preferences
Explain that while these don't match the ${theme} theme, we'll notify when more relevant content is available.`;
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

  // Helper method to get country name from country code
  static getCountryName(countryCode) {
    if (!countryCode) return "United States"; // Default

    // If it's already a full country name, return it
    if (countryCode.length > 2) return countryCode;

    // Otherwise try to find the name from code
    try {
      const countriesData = DataLoader.loadCountryData();
      const foundCountry = countriesData.find((c) => c.code === countryCode);
      return foundCountry ? foundCountry.country : "United States";
    } catch (error) {
      console.error("Error getting country name:", error);
      return "United States";
    }
  }

  // Helper method to get language name from language code
  static getLanguageName(languageCode) {
    if (!languageCode) return "English"; // Default

    // If it's already a full language name, return it
    if (languageCode.length > 2) return languageCode;

    // Otherwise try to find the name from code
    try {
      const languagesData = DataLoader.loadLanguageData();
      const foundLanguage = languagesData.find((l) => l.code === languageCode);
      return foundLanguage ? foundLanguage.language : "English";
    } catch (error) {
      console.error("Error getting language name:", error);
      return "English";
    }
  }

  // Generate a mock AI recommendation when the real AI is unavailable
  static generateMockRecommendation(
    countryName,
    languageName,
    theme,
    articles
  ) {
    // Make sure we have proper values
    countryName = countryName || "United States";
    languageName = languageName || "English";
    theme = theme || "General News";

    // Return a formatted recommendation that looks like it came from the AI
    return `# Personalized News Recommendations

Here are articles selected for your interest in ${theme} news from ${countryName} in ${languageName}.

## Top Recommendations

${articles
  .slice(0, 3)
  .map(
    (article, index) => `
### Article #${index}: ${article.title || `News about ${theme}`}

This article is relevant to your interest in ${theme} because it directly covers recent developments and trends in this field. The content specifically focuses on ${countryName}, presented in ${languageName}, making it a perfect match for your preferences.

${
  article.summary ||
  article.description ||
  "The article provides comprehensive coverage of this topic."
}
`
  )
  .join("\n")}

## Summary

These articles provide comprehensive coverage of ${theme} topics from ${countryName} in ${languageName}, tailored to your specific interests and preferences.`;
  }
}

module.exports = NewsController;
