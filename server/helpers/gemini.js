const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

class GeminiHelper {
  static async generateContent(prompt, config = {}) {
    const apiKey = process.env.GEMINI_API;

    if (!apiKey) {
      console.warn("Gemini API key is not configured");
      return "AI recommendations unavailable - API key not configured. Please contact the administrator.";
    }

    try {
      // Initialize the Google AI client
      const genAI = new GoogleGenerativeAI(apiKey);

      // Default configuration
      const defaultConfig = {
        temperature: 0.7, // Slightly reduced for more consistent output
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

      // First try with gemini-1.5-pro model
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
          generationConfig,
          safetySettings,
        });

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Return the generated text
        return response.text();
      } catch (specificModelError) {
        console.warn(
          "Error with gemini-1.5-pro, falling back to gemini-pro:",
          specificModelError.message
        );

        // Fallback to gemini-pro if the specified model isn't available
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-pro",
          generationConfig,
          safetySettings,
        });

        const fallbackResult = await fallbackModel.generateContent(prompt);
        const fallbackResponse = await fallbackResult.response;
        return fallbackResponse.text();
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      // Return a user-friendly message instead of throwing
      return "Unable to generate AI recommendation at this time. Please try again later.";
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
