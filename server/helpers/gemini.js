const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

class GeminiHelper {
  static async generateContent(prompt, config = {}) {
    const apiKey = process.env.GEMINI_API;

    if (!apiKey) {
      throw {
        name: "BadRequest",
        message: "Gemini API key is not configured",
      };
    }

    try {
      // Initialize the Google AI client
      const genAI = new GoogleGenerativeAI(apiKey);

      // Default configuration
      const defaultConfig = {
        temperature: 0.9,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      // Merge with custom config if provided
      const generationConfig = { ...defaultConfig, ...config };

      // For safety settings (optional - can be adjusted based on your needs)
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      // Get the model - use gemini-1.5-pro or gemini-1.0-pro instead of gemini-pro
      // gemini-pro was renamed in newer API versions
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Updated model name for newest API
        generationConfig,
        safetySettings,
      });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;

      // Return the generated text
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      // Handle and format Gemini API errors
      throw {
        name: "BadRequest",
        message: `Gemini API Error: ${error.message || "Unknown error"}`,
      };
    }
  }

  static async summarize(text, maxLength = 512) {
    const prompt = `Please summarize the following text concisely in 3-4 sentences:\n\n${text}`;

    // Configuration specifically tuned for summarization
    const config = {
      temperature: 0.2,
      topK: 40,
      topP: 0.8,
      maxOutputTokens: maxLength,
    };

    return await this.generateContent(prompt, config);
  }
}

module.exports = GeminiHelper;
