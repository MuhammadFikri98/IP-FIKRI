import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import countries from "../../../buat di client nanti/country.json";
import languages from "../../../buat di client nanti/language.json";
import themes from "../../../buat di client nanti/theme.json";
import Swal from "sweetalert2";
import Card from "../components/Card";

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // "about", "preferences", "collections", "recommendations"
  const [userData, setUserData] = useState({
    id: null,
    email: "",
  });

  // Preferences state
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");

  // Collections state
  const [collections, setCollections] = useState([]);
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
    // Validate that required properties are selected
    if (!selectedCountry) {
      setError("Silakan pilih negara terlebih dahulu");
      return;
    }

    if (!selectedLanguage) {
      setError("Silakan pilih bahasa terlebih dahulu");
      return;
    }

    if (!selectedTheme) {
      setError("Silakan pilih tema terlebih dahulu");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");

      // Properly format the data to meet backend requirements
      const collectionData = {
        country: selectedCountry,
        language: selectedLanguage,
        theme: selectedTheme,
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
      setSelectedCountry("");
      setSelectedLanguage("");
      setSelectedTheme("");

      // Refresh collections
      if (userData.id) {
        fetchCollections(token, userData.id);
      }

      // Show success message with SweetAlert2 instead of browser alert
      setError(null);

      Swal.fire({
        icon: "success",
        title: "Sukses!",
        text: "Koleksi berhasil dibuat",
        confirmButtonColor: "#1a3a6c",
        timer: 2000,
        timerProgressBar: true,
      });

      // Move to recommendations tab
      setActiveTab("recommendations");
      fetchNewsRecommendations();
    } catch (error) {
      console.error(
        "Collection creation error:",
        error.response?.data || error
      );

      // Show error message with SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.response?.data?.message || "Gagal membuat koleksi",
        confirmButtonColor: "#d33",
      });

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

  // Fungsi untuk menghapus koleksi
  const handleDeleteCollection = async (collectionId) => {
    try {
      // Konfirmasi penghapusan dengan SweetAlert2
      const result = await Swal.fire({
        title: "Anda yakin?",
        text: "Koleksi yang dihapus tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      });

      // Jika pengguna membatalkan, tidak melakukan apa-apa
      if (!result.isConfirmed) {
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem("access_token");

      // Panggil API untuk menghapus koleksi
      await axios.delete(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections/${collectionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Perbarui daftar koleksi setelah berhasil menghapus
      if (userData.id) {
        fetchCollections(token, userData.id);
      }

      // Tampilkan notifikasi sukses
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Koleksi telah dihapus",
        confirmButtonColor: "#1a3a6c",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Delete collection error:", error.response?.data || error);

      // Tampilkan pesan error
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.response?.data?.message || "Gagal menghapus koleksi",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsLoading(false);
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
                                  <i className="bi bi-globe me-2"></i>Pilih
                                  Negara
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                {countries.map((country) => (
                                  <div
                                    className="form-check"
                                    key={country.code}
                                  >
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      id={`country-${country.code}`}
                                      name="country-selection"
                                      checked={selectedCountry === country.code}
                                      onChange={() =>
                                        setSelectedCountry(country.code)
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
                                  {selectedCountry ? (
                                    <span>
                                      Negara:{" "}
                                      <strong>
                                        {
                                          countries.find(
                                            (c) => c.code === selectedCountry
                                          )?.country
                                        }
                                      </strong>
                                    </span>
                                  ) : (
                                    <span className="text-muted">
                                      Silakan pilih negara
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-header bg-success text-white">
                                <h5 className="mb-0">
                                  <i className="bi bi-translate me-2"></i>Pilih
                                  Bahasa
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                {languages.map((language) => (
                                  <div
                                    className="form-check"
                                    key={language.code}
                                  >
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      id={`language-${language.code}`}
                                      name="language-selection"
                                      checked={
                                        selectedLanguage === language.code
                                      }
                                      onChange={() =>
                                        setSelectedLanguage(language.code)
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
                                  {selectedLanguage ? (
                                    <span>
                                      Bahasa:{" "}
                                      <strong>
                                        {
                                          languages.find(
                                            (l) => l.code === selectedLanguage
                                          )?.language
                                        }
                                      </strong>
                                    </span>
                                  ) : (
                                    <span className="text-muted">
                                      Silakan pilih bahasa
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <div className="card h-100">
                              <div className="card-header bg-danger text-white">
                                <h5 className="mb-0">
                                  <i className="bi bi-tags me-2"></i>Pilih Tema
                                  Berita
                                </h5>
                              </div>
                              <div
                                className="card-body"
                                style={{ height: "300px", overflowY: "auto" }}
                              >
                                {themes.map((theme) => (
                                  <div className="form-check" key={theme.theme}>
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      id={`theme-${theme.theme}`}
                                      name="theme-selection"
                                      checked={selectedTheme === theme.theme}
                                      onChange={() =>
                                        setSelectedTheme(theme.theme)
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
                                  {selectedTheme ? (
                                    <span>
                                      Tema: <strong>{selectedTheme}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-muted">
                                      Silakan pilih tema
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setSelectedCountry("");
                              setSelectedLanguage("");
                              setSelectedTheme("");
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
                                !selectedCountry ||
                                !selectedLanguage ||
                                !selectedTheme
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
                            <h5 className="mb-0">Buat Koleksi Baru</h5>
                          </div>
                          <div className="card-body">
                            <div className="alert alert-info">
                              <small>
                                <i className="bi bi-info-circle me-1"></i>
                                Koleksi ini akan menggunakan preferensi yang
                                Anda pilih:
                                <ul className="mb-0 mt-1">
                                  <li>
                                    <strong>Negara:</strong>{" "}
                                    {selectedCountry
                                      ? countries.find(
                                          (c) => c.code === selectedCountry
                                        )?.country
                                      : "Belum dipilih"}
                                  </li>
                                  <li>
                                    <strong>Bahasa:</strong>{" "}
                                    {selectedLanguage
                                      ? languages.find(
                                          (l) => l.code === selectedLanguage
                                        )?.language
                                      : "Belum dipilih"}
                                  </li>
                                  <li>
                                    <strong>Tema:</strong>{" "}
                                    {selectedTheme || "Belum dipilih"}
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
                                !selectedCountry ||
                                !selectedLanguage ||
                                !selectedTheme
                              }
                            >
                              <i className="bi bi-plus-circle me-1"></i> Buat
                              Koleksi
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
                                <Card
                                  collection={collection}
                                  index={index}
                                  onDelete={(collectionId) => {
                                    // Perbarui daftar koleksi secara lokal (opsional)
                                    setCollections(
                                      collections.filter(
                                        (c) => c.id !== collectionId
                                      )
                                    );
                                  }}
                                  onRefresh={() => {
                                    const token =
                                      localStorage.getItem("access_token");
                                    if (userData.id) {
                                      fetchCollections(token, userData.id);
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
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
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "https://via.placeholder.com/600x400?text=News+Image";
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
                                        href={news.url || "#"}
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

                            <div className="d-flex justify-content-between mt-4">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => setActiveTab("collections")}
                              >
                                <i className="bi bi-arrow-left me-1"></i> Back
                                to Collections
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
                        )}
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
