import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import countries from "../../../buat di client nanti/country.json";
import languages from "../../../buat di client nanti/language.json";
import themes from "../../../buat di client nanti/theme.json";

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // "about", "preferences", "collections", "recommendations"
  const [userData, setUserData] = useState({
    id: null,
    email: "",
  });

  // Preferences state
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);

  // Collections state
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
  });

  // News recommendations state
  const [newsRecommendations, setNewsRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Effect to fetch collections when userData.id is available
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && userData.id) {
      fetchCollections(token, userData.id);
    }
  }, [userData.id]);

  const fetchUserData = async (token) => {
    try {
      // Extract user data from JWT token
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserData({
        id: payload.id,
        email: payload.email,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchCollections = async (token, userId) => {
    try {
      setIsLoading(true);

      // Use proper endpoint with userId parameter
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/users/${userId}/collections`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCollections(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError("Failed to load your collections. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.name) {
      setError("Collection name is required");
      return;
    }

    // Validate that required properties are selected
    if (selectedCountries.length === 0) {
      setError("Please select at least one country");
      return;
    }

    if (selectedLanguages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    if (selectedThemes.length === 0) {
      setError("Please select at least one theme");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");

      // Properly format the data to meet backend requirements
      // Just use the first selected items for each category to match the model structure
      const collectionData = {
        name: newCollection.name,
        description: newCollection.description,
        country: selectedCountries[0], // Send the first selected country
        language: selectedLanguages[0], // Send the first selected language
        theme: selectedThemes[0], // Send the first selected theme
      };

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections`,
        collectionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reset form
      setNewCollection({ name: "", description: "" });

      // Refresh collections
      if (userData.id) {
        fetchCollections(token, userData.id);
      }

      // Show success message
      setError(null);
      alert("Collection created successfully!");

      // Move to recommendations tab
      setActiveTab("recommendations");
      fetchNewsRecommendations();
    } catch (error) {
      console.error(
        "Collection creation error:",
        error.response?.data || error
      );
      setError(error.response?.data?.message || "Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewsRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      // Check if user has collections first
      if (collections.length === 0) {
        setError(
          "You need to create a collection first to get personalized news recommendations"
        );
        setIsLoading(false);
        return;
      }

      // Get recommendations from the server
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/news/recommendations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Recommendations response:", response.data);

      // Handle the response structure correctly
      if (response.data.news) {
        setNewsRecommendations(response.data.news);
      } else {
        setNewsRecommendations([]);
      }

      // If empty news but we have a message
      if (
        response.data.news &&
        response.data.news.length === 0 &&
        response.data.message
      ) {
        setError(response.data.message);
      }
    } catch (error) {
      console.error(
        "Error fetching recommendations:",
        error.response?.data || error
      );

      // Check for specific error messages from the API
      if (error.response?.status === 402) {
        // Use mock data for demonstration if the API requires payment
        console.log("Using demo data due to API payment requirement");
        const mockData = generateMockNewsData();
        setNewsRecommendations(mockData);
        setError(
          "Note: Using demo data. The real news API requires payment or has exceeded free usage limits."
        );
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError(
          "You need to create a collection with country, language, and theme information first"
        );
      } else {
        setError(
          "Failed to fetch news recommendations. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate mock news data for demo purposes
  const generateMockNewsData = () => {
    // Get preferences from the most recent collection
    const latestCollection = collections[collections.length - 1];
    const country = latestCollection?.country || "Unknown";
    const language = latestCollection?.language || "Unknown";
    const theme = latestCollection?.theme || "Unknown";

    // Find readable names for codes
    const countryName =
      countries.find((c) => c.code === country)?.country || country;
    const languageName =
      languages.find((l) => l.code === language)?.language || language;

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
      },
    ];
  };

  const handleCountrySelection = (countryCode) => {
    if (selectedCountries.includes(countryCode)) {
      setSelectedCountries(
        selectedCountries.filter((code) => code !== countryCode)
      );
    } else {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  };

  const handleLanguageSelection = (languageCode) => {
    if (selectedLanguages.includes(languageCode)) {
      setSelectedLanguages(
        selectedLanguages.filter((code) => code !== languageCode)
      );
    } else {
      setSelectedLanguages([...selectedLanguages, languageCode]);
    }
  };

  const handleThemeSelection = (theme) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  // Debug function
  const checkAndClearToken = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      console.log("Token ditemukan di localStorage:", token);
      // Hapus token untuk debug
      localStorage.removeItem("access_token");
      console.log("Token telah dihapus");
      setIsLoggedIn(false);
    } else {
      console.log("Tidak ada token di localStorage");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Hero Section */}
          <div className="card border-0 shadow-lg mb-5">
            <div
              className="card-body p-5"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2a5298 100%)",
              }}
            >
              <div className="row align-items-center">
                <div className="col-lg-8 text-white">
                  <h1 className="display-4 fw-bold mb-3">NEWS GenAI</h1>
                  <h3 className="mb-4">Berita Cerdas dengan Kekuatan AI</h3>
                  <p className="lead mb-4">
                    Temukan berita yang dipersonalisasi khusus untuk Anda. NEWS
                    GenAI menggunakan teknologi kecerdasan buatan untuk
                    merekomendasikan berita berdasarkan preferensi Anda tentang
                    negara, bahasa, dan tema yang Anda minati.
                  </p>
                  {!isLoggedIn ? (
                    <div className="d-flex gap-3">
                      <Link to="/login" className="btn btn-light btn-lg px-4">
                        <i className="bi bi-box-arrow-in-right me-2"></i>Login
                      </Link>
                      <Link
                        to="/register"
                        className="btn btn-outline-light btn-lg px-4"
                      >
                        <i className="bi bi-person-plus me-2"></i>Register
                      </Link>
                    </div>
                  ) : (
                    <div className="d-flex gap-3">
                      <button
                        onClick={() => {
                          setActiveTab("preferences");
                          window.scrollTo({ top: 600, behavior: "smooth" });
                        }}
                        className="btn btn-light btn-lg px-4"
                      >
                        <i className="bi bi-gear-fill me-2"></i>Set Preferences
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("recommendations");
                          fetchNewsRecommendations();
                          window.scrollTo({ top: 600, behavior: "smooth" });
                        }}
                        className="btn btn-outline-light btn-lg px-4"
                      >
                        <i className="bi bi-newspaper me-2"></i>View
                        Recommendations
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-lg-4 text-center mt-4 mt-lg-0">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyq39em67_SncwnlkF9OQN90FuLgb292LzZDKCvqtjCXo0hlgdsA&s=10&ec=72940545"
                    className="img-fluid rounded-circle border border-3 border-white"
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      backgroundColor: "white",
                    }}
                    alt="NEWS GenAI Logo"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoggedIn && (
            <>
              {/* Tabs Navigation */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "about" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("about")}
                  >
                    <i className="bi bi-info-circle me-1"></i> About
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "preferences" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("preferences")}
                  >
                    <i className="bi bi-sliders me-1"></i> Set Preferences
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "collections" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("collections")}
                  >
                    <i className="bi bi-collection me-1"></i> My Collections
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "recommendations" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab("recommendations");
                      fetchNewsRecommendations();
                    }}
                  >
                    <i className="bi bi-newspaper me-1"></i> Recommendations
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* About Tab */}
                {activeTab === "about" && (
                  <div className="tab-pane fade show active">
                    {/* Features Section */}
                    <div className="row mb-5">
                      <div className="col-md-4 mb-4">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body text-center p-4">
                            <div
                              className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                              style={{ width: "80px", height: "80px" }}
                            >
                              <i
                                className="bi bi-translate"
                                style={{ fontSize: "2rem" }}
                              ></i>
                            </div>
                            <h4 className="card-title">Multi Bahasa</h4>
                            <p className="card-text">
                              Dapatkan berita dalam berbagai bahasa sesuai
                              preferensi Anda
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-4">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body text-center p-4">
                            <div
                              className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3"
                              style={{ width: "80px", height: "80px" }}
                            >
                              <i
                                className="bi bi-globe-americas"
                                style={{ fontSize: "2rem" }}
                              ></i>
                            </div>
                            <h4 className="card-title">Global Coverage</h4>
                            <p className="card-text">
                              Berita dari berbagai negara di seluruh dunia
                              sesuai minat Anda
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-4">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body text-center p-4">
                            <div
                              className="rounded-circle bg-danger text-white d-inline-flex align-items-center justify-content-center mb-3"
                              style={{ width: "80px", height: "80px" }}
                            >
                              <i
                                className="bi bi-robot"
                                style={{ fontSize: "2rem" }}
                              ></i>
                            </div>
                            <h4 className="card-title">AI Powered</h4>
                            <p className="card-text">
                              Rekomendasi berita dengan kecerdasan buatan dari
                              teknologi Gemini
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* How It Works Section */}
                    <div className="card border-0 shadow-sm mb-5">
                      <div className="card-body p-4">
                        <h3 className="text-center mb-4">
                          Bagaimana NEWS GenAI Bekerja
                        </h3>
                        <div className="row g-4">
                          <div className="col-md-3">
                            <div className="text-center">
                              <div
                                className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <span className="fw-bold fs-4">1</span>
                              </div>
                              <h5>Register</h5>
                              <p className="small">
                                Buat akun Anda dengan cepat dan mudah
                              </p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center">
                              <div
                                className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <span className="fw-bold fs-4">2</span>
                              </div>
                              <h5>Pilih Preferensi</h5>
                              <p className="small">
                                Tentukan negara, bahasa, dan tema berita favorit
                                Anda
                              </p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center">
                              <div
                                className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <span className="fw-bold fs-4">3</span>
                              </div>
                              <h5>Buat Koleksi</h5>
                              <p className="small">
                                Simpan berita favorit Anda dalam koleksi
                                personal
                              </p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center">
                              <div
                                className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <span className="fw-bold fs-4">4</span>
                              </div>
                              <h5>Dapatkan Rekomendasi</h5>
                              <p className="small">
                                AI akan merekomendasikan berita yang paling
                                relevan untuk Anda
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                  <div className="tab-pane fade show active">
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-body p-4">
                        <h3>
                          <i className="bi bi-sliders me-2"></i>Set Your News
                          Preferences
                        </h3>
                        <p className="text-muted">
                          Select your preferred countries, languages, and news
                          themes to get personalized recommendations.
                        </p>

                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        )}

                        <div className="row mb-4">
                          <div className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">
                                  <i className="bi bi-globe me-2"></i>Select
                                  Countries
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="all-countries"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCountries(
                                          countries.map((c) => c.code)
                                        );
                                      } else {
                                        setSelectedCountries([]);
                                      }
                                    }}
                                    checked={
                                      selectedCountries.length ===
                                      countries.length
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="all-countries"
                                  >
                                    <strong>Select All</strong>
                                  </label>
                                </div>
                                <hr />
                                {countries.map((country) => (
                                  <div
                                    className="form-check"
                                    key={country.code}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`country-${country.code}`}
                                      checked={selectedCountries.includes(
                                        country.code
                                      )}
                                      onChange={() =>
                                        handleCountrySelection(country.code)
                                      }
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`country-${country.code}`}
                                    >
                                      {country.country}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="card-footer bg-light">
                                <small>
                                  <strong>{selectedCountries.length}</strong>{" "}
                                  countries selected
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-header bg-success text-white">
                                <h5 className="mb-0">
                                  <i className="bi bi-translate me-2"></i>Select
                                  Languages
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="all-languages"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedLanguages(
                                          languages.map((l) => l.code)
                                        );
                                      } else {
                                        setSelectedLanguages([]);
                                      }
                                    }}
                                    checked={
                                      selectedLanguages.length ===
                                      languages.length
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="all-languages"
                                  >
                                    <strong>Select All</strong>
                                  </label>
                                </div>
                                <hr />
                                {languages.map((language) => (
                                  <div
                                    className="form-check"
                                    key={language.code}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`language-${language.code}`}
                                      checked={selectedLanguages.includes(
                                        language.code
                                      )}
                                      onChange={() =>
                                        handleLanguageSelection(language.code)
                                      }
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`language-${language.code}`}
                                    >
                                      {language.language}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="card-footer bg-light">
                                <small>
                                  <strong>{selectedLanguages.length}</strong>{" "}
                                  languages selected
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-header bg-danger text-white">
                                <h5 className="mb-0">
                                  <i className="bi bi-tags me-2"></i>Select News
                                  Themes
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="all-themes"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedThemes(
                                          themes.map((t) => t.theme)
                                        );
                                      } else {
                                        setSelectedThemes([]);
                                      }
                                    }}
                                    checked={
                                      selectedThemes.length === themes.length
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="all-themes"
                                  >
                                    <strong>Select All</strong>
                                  </label>
                                </div>
                                <hr />
                                {themes.map((theme) => (
                                  <div className="form-check" key={theme.theme}>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`theme-${theme.theme}`}
                                      checked={selectedThemes.includes(
                                        theme.theme
                                      )}
                                      onChange={() =>
                                        handleThemeSelection(theme.theme)
                                      }
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`theme-${theme.theme}`}
                                    >
                                      {theme.theme}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="card-footer bg-light">
                                <small>
                                  <strong>{selectedThemes.length}</strong>{" "}
                                  themes selected
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setSelectedCountries([]);
                              setSelectedLanguages([]);
                              setSelectedThemes([]);
                            }}
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>{" "}
                            Reset
                          </button>
                          <div>
                            <button
                              className="btn btn-outline-primary me-2"
                              onClick={() => setActiveTab("about")}
                            >
                              <i className="bi bi-arrow-left me-1"></i> Back
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => setActiveTab("collections")}
                              disabled={
                                !selectedCountries.length ||
                                !selectedLanguages.length ||
                                !selectedThemes.length
                              }
                            >
                              Next <i className="bi bi-arrow-right ms-1"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collections Tab */}
                {activeTab === "collections" && (
                  <div className="tab-pane fade show active">
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-body p-4">
                        <h3>
                          <i className="bi bi-collection me-2"></i>My
                          Collections
                        </h3>
                        <p className="text-muted">
                          Create collections to organize news by your interests.
                        </p>

                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        )}

                        {/* Create New Collection Form */}
                        <div className="card mb-4">
                          <div className="card-header bg-light">
                            <h5 className="mb-0">Create New Collection</h5>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <label
                                htmlFor="collectionName"
                                className="form-label"
                              >
                                Collection Name*
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="collectionName"
                                value={newCollection.name}
                                onChange={(e) =>
                                  setNewCollection({
                                    ...newCollection,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="e.g., Tech News, Sports Updates, etc."
                              />
                            </div>
                            <div className="mb-3">
                              <label
                                htmlFor="collectionDescription"
                                className="form-label"
                              >
                                Description
                              </label>
                              <textarea
                                className="form-control"
                                id="collectionDescription"
                                rows="2"
                                value={newCollection.description}
                                onChange={(e) =>
                                  setNewCollection({
                                    ...newCollection,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="What kind of news will this collection contain?"
                              ></textarea>
                            </div>
                            <div className="alert alert-info">
                              <small>
                                <i className="bi bi-info-circle me-1"></i>
                                This collection will include your selected
                                preferences:
                                <ul className="mb-0 mt-1">
                                  <li>
                                    <strong>Countries:</strong>{" "}
                                    {selectedCountries.length} selected
                                  </li>
                                  <li>
                                    <strong>Languages:</strong>{" "}
                                    {selectedLanguages.length} selected
                                  </li>
                                  <li>
                                    <strong>Themes:</strong>{" "}
                                    {selectedThemes.length} selected
                                  </li>
                                </ul>
                              </small>
                            </div>
                          </div>
                          <div className="card-footer">
                            <button
                              className="btn btn-primary"
                              onClick={handleCreateCollection}
                              disabled={
                                !newCollection.name ||
                                !selectedCountries.length ||
                                !selectedLanguages.length ||
                                !selectedThemes.length
                              }
                            >
                              <i className="bi bi-plus-circle me-1"></i> Create
                              Collection
                            </button>
                          </div>
                        </div>

                        {/* Existing Collections */}
                        <h5 className="mb-3">Your Collections</h5>
                        {collections.length === 0 ? (
                          <div className="alert alert-light text-center">
                            <i className="bi bi-folder me-2"></i>
                            You don't have any collections yet. Create one to
                            get started!
                          </div>
                        ) : (
                          <div className="row">
                            {collections.map((collection, index) => (
                              <div
                                className="col-md-6 mb-3"
                                key={collection.id}
                              >
                                <div
                                  className="card h-100 border-start border-4"
                                  style={{ borderLeftColor: "#1a3a6c" }}
                                >
                                  <div className="card-header bg-light d-flex align-items-center">
                                    <div
                                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                                      style={{
                                        width: "28px",
                                        height: "28px",
                                        minWidth: "28px",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {index + 1}
                                    </div>
                                    <h5 className="card-title mb-0">
                                      <i className="bi bi-collection me-2 text-primary"></i>
                                      {collection.name}
                                    </h5>
                                  </div>
                                  <div className="card-body">
                                    {collection.description && (
                                      <p className="card-text mb-3">
                                        {collection.description}
                                      </p>
                                    )}

                                    <div className="mb-3">
                                      <div className="d-flex align-items-center mb-2">
                                        <div
                                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                          }}
                                        >
                                          <i className="bi bi-globe text-white small"></i>
                                        </div>
                                        <strong>Country:</strong>
                                      </div>
                                      <div className="ms-4">
                                        <span className="badge bg-primary me-1">
                                          {countries.find(
                                            (c) => c.code === collection.country
                                          )?.country || collection.country}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mb-3">
                                      <div className="d-flex align-items-center mb-2">
                                        <div
                                          className="rounded-circle bg-success d-flex align-items-center justify-content-center me-2"
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                          }}
                                        >
                                          <i className="bi bi-translate text-white small"></i>
                                        </div>
                                        <strong>Language:</strong>
                                      </div>
                                      <div className="ms-4">
                                        <span className="badge bg-success me-1">
                                          {languages.find(
                                            (l) =>
                                              l.code === collection.language
                                          )?.language || collection.language}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mb-2">
                                      <div className="d-flex align-items-center mb-2">
                                        <div
                                          className="rounded-circle bg-danger d-flex align-items-center justify-content-center me-2"
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                          }}
                                        >
                                          <i className="bi bi-tags text-white small"></i>
                                        </div>
                                        <strong>Theme:</strong>
                                      </div>
                                      <div className="ms-4">
                                        <span className="badge bg-danger me-1">
                                          {collection.theme}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="card-footer bg-transparent d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      Created:{" "}
                                      {new Date(
                                        collection.createdAt
                                      ).toLocaleDateString()}
                                    </small>
                                    <div>
                                      <button
                                        className="btn btn-sm btn-outline-primary me-1"
                                        title="Edit collection"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        title="Delete collection"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="d-flex justify-content-between mt-4">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setActiveTab("preferences")}
                          >
                            <i className="bi bi-arrow-left me-1"></i> Back to
                            Preferences
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setActiveTab("recommendations");
                              fetchNewsRecommendations();
                            }}
                          >
                            Get Recommendations{" "}
                            <i className="bi bi-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === "recommendations" && (
                  <div className="tab-pane fade show active">
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="card-body p-4">
                        <h3>
                          <i className="bi bi-newspaper me-2"></i>Your News
                          Recommendations
                        </h3>
                        <p className="text-muted">
                          Personalized news based on your preferences and
                          collections.
                        </p>

                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        )}

                        {isLoading ? (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-3">
                              Generating your personalized news feed...
                            </p>
                          </div>
                        ) : newsRecommendations.length === 0 ? (
                          <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            No recommendations yet! Make sure you've created at
                            least one collection with your preferences.
                            <div className="mt-3">
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => setActiveTab("preferences")}
                              >
                                Set Preferences
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setActiveTab("collections")}
                              >
                                Create Collection
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="row">
                            {newsRecommendations.map((news, index) => (
                              <div className="col-md-6 mb-4" key={index}>
                                <div className="card h-100 shadow-sm">
                                  {news.urlToImage && (
                                    <img
                                      src={news.urlToImage}
                                      className="card-img-top"
                                      alt={news.title}
                                      style={{
                                        height: "200px",
                                        objectFit: "cover",
                                      }}
                                    />
                                  )}
                                  <div className="card-body">
                                    <h5 className="card-title">{news.title}</h5>
                                    <p className="card-text">
                                      {news.description}
                                    </p>
                                    <div className="d-flex mb-2">
                                      <span className="badge bg-primary me-1">
                                        {news.source?.name}
                                      </span>
                                      {news.country && (
                                        <span className="badge bg-secondary me-1">
                                          {countries.find(
                                            (c) => c.code === news.country
                                          )?.country || news.country}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      {news.publishedAt
                                        ? new Date(
                                            news.publishedAt
                                          ).toLocaleDateString()
                                        : "No date"}
                                    </small>
                                    <div>
                                      <a
                                        href={news.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary me-1"
                                      >
                                        <i className="bi bi-box-arrow-up-right me-1"></i>
                                        Read
                                      </a>
                                      <button className="btn btn-sm btn-outline-success">
                                        <i className="bi bi-bookmark me-1"></i>
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="d-flex justify-content-between mt-4">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setActiveTab("collections")}
                          >
                            <i className="bi bi-arrow-left me-1"></i> Back to
                            Collections
                          </button>
                          {newsRecommendations.length > 0 && (
                            <button
                              className="btn btn-primary"
                              onClick={fetchNewsRecommendations}
                            >
                              <i className="bi bi-arrow-clockwise me-1"></i>{" "}
                              Refresh
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Debug button - only visible in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-center mt-3">
              <button
                onClick={checkAndClearToken}
                className="btn btn-outline-secondary btn-sm"
              >
                <i className="bi bi-bug me-1"></i> Debug Token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
