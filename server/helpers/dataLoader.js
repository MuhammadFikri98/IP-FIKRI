const fs = require("fs");
const path = require("path");

class DataLoader {
  static loadCountryMap() {
    try {
      // Fix the path to correctly point to the country.json file
      const countryData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "../..", "buat di client nanti", "country.json"),
          "utf8"
        )
      );

      // Transform the data into a map of country name -> country code
      const countryMap = {};
      countryData.forEach((item) => {
        countryMap[item.country] = item.code;
      });

      return countryMap;
    } catch (error) {
      console.error("Error loading country data:", error);
      // Return default mapping if file can't be loaded
      return {
        "United States": "us",
        "United Kingdom": "gb",
        Australia: "au",
        Canada: "ca",
        India: "in",
        Japan: "jp",
        Germany: "de",
        France: "fr",
        Italy: "it",
        Spain: "es",
        China: "cn",
        Russia: "ru",
        Brazil: "br",
        Indonesia: "id",
      };
    }
  }

  static loadLanguageMap() {
    try {
      // Fix the path to correctly point to the language.json file
      const languageData = JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "../..",
            "buat di client nanti",
            "language.json"
          ),
          "utf8"
        )
      );

      // Transform the data into a map of language name -> language code
      const languageMap = {};
      languageData.forEach((item) => {
        languageMap[item.language] = item.code;
      });

      return languageMap;
    } catch (error) {
      console.error("Error loading language data:", error);
      // Return default mapping if file can't be loaded
      return {
        English: "en",
        Spanish: "es",
        French: "fr",
        German: "de",
        Italian: "it",
        Japanese: "ja",
        Chinese: "zh",
        Russian: "ru",
        Arabic: "ar",
        Portuguese: "pt",
        Indonesian: "id",
      };
    }
  }
}

module.exports = DataLoader;
