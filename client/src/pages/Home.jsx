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
  const [aiRecommendation, setAiRecommendation] = useState("");
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
          "Anda perlu membuat koleksi terlebih dahulu untuk mendapatkan rekomendasi berita personal"
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

      // Log response data for debugging
      console.log("News API response:", response.data);

      // Handle the response structure correctly
      if (response.data.news) {
        setNewsRecommendations(response.data.news);

        // Set the AI recommendation if available
        if (response.data.aiRecommendation) {
          setAiRecommendation(response.data.aiRecommendation);
        } else {
          setAiRecommendation("");
        }

        // If there's a user preferences object, update UI to show current preferences
        if (response.data.userPreferences) {
          const prefs = response.data.userPreferences;
          // Display current preferences in a user-friendly format
          console.log("Current preferences:", prefs);

          // If preferences message is provided, show it
          if (response.data.message) {
            setError(response.data.message);
          }
        }
      } else {
        setNewsRecommendations([]);
        setAiRecommendation("");
        // Show message if provided
        if (response.data.message) {
          setError(response.data.message);
        }
      }
    } catch (error) {
      console.error(
        "Error fetching recommendations:",
        error.response?.data || error
      );

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError(
          "Anda perlu membuat koleksi dengan informasi negara dan bahasa terlebih dahulu"
        );
      } else {
        setError(
          "Gagal mengambil rekomendasi berita. Silakan coba lagi nanti."
        );
      }
    } finally {
      setIsLoading(false);
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
                          <div>
                            {/* AI Recommendation Card */}
                            {aiRecommendation && (
                              <div className="card mb-3 shadow-sm border-0">
                                <div className="card-header bg-danger bg-opacity-75 text-white d-flex align-items-center py-2">
                                  <i
                                    className="bi bi-robot me-2"
                                    style={{ fontSize: "1rem" }}
                                  ></i>
                                  <h6 className="mb-0">
                                    AI-Generated Recommendations
                                  </h6>
                                </div>
                                <div className="card-body bg-light p-3">
                                  <div
                                    className="markdown-content small"
                                    dangerouslySetInnerHTML={{
                                      __html: aiRecommendation
                                        // Pemformatan dasar
                                        .replace(/\n/g, "<br>")
                                        .replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong>$1</strong>"
                                        )
                                        .replace(/\*(.*?)\*/g, "<em>$1</em>")

                                        // Format judul utama
                                        .replace(
                                          /^# (.*?)$/gm,
                                          '<h5 class="text-primary fw-bold mb-3">$1</h5>'
                                        )

                                        // Format judul section dengan garis bawah
                                        .replace(
                                          /^## Top Recommendations$/gm,
                                          '<h6 class="text-danger fw-bold mt-3 mb-3 pb-2 border-bottom">Top Recommendations</h6>'
                                        )
                                        .replace(
                                          /^## (.*?)$/gm,
                                          '<h6 class="text-danger fw-bold mt-3 mb-3 pb-2 border-bottom">$1</h6>'
                                        )

                                        // Format artikel dengan kartu yang lebih rapi
                                        .replace(
                                          /^### Article #(\d+): (.*?)$/gm,
                                          '<div class="card mb-2 border-light"><div class="card-header py-2 bg-white"><span class="badge bg-primary me-2">Article $1</span><strong>$2</strong></div><div class="card-body py-2 px-3 small">'
                                        )
                                        .replace(
                                          /^### (.*?)$/gm,
                                          '<div class="card mb-2 border-light"><div class="card-header py-2 bg-white"><strong>$1</strong></div><div class="card-body py-2 px-3 small">'
                                        )

                                        // Penutup kartu artikel dan section
                                        .replace(
                                          /<br><br><br>/g,
                                          "</div></div>"
                                        )
                                        .replace(
                                          /<br><br>## /g,
                                          "</div></div><br>## "
                                        )

                                        // Format penjelasan yang lebih jelas dengan ikon
                                        .replace(
                                          /This article is relevant to your interest/g,
                                          '<div class="mb-1"><i class="bi bi-check-circle-fill text-success me-1"></i> <strong>Relevance:</strong> '
                                        )
                                        .replace(
                                          /How it connects to/g,
                                          '</div><div class="mb-1"><i class="bi bi-geo-alt-fill text-info me-1"></i> <strong>Connection:</strong> '
                                        )

                                        // Format ringkasan yang lebih baik
                                        .replace(
                                          /## Summary/g,
                                          '</div></div><div class="alert alert-info mt-3 mb-0 small"><i class="bi bi-info-circle-fill me-2"></i><strong>Summary:</strong>'
                                        )
                                        .replace(
                                          /(One sentence explaining how these articles match your preferences\.)/g,
                                          "$1</div>"
                                        )

                                        // Perbaikan untuk tampilan alternatif (ketika artikel tidak cocok dengan tema)
                                        .replace(
                                          /^## Available Recommendations$/gm,
                                          '<h6 class="text-danger fw-bold mt-3 mb-3 pb-2 border-bottom">Available Recommendations</h6>'
                                        )
                                        .replace(
                                          /^## Note about your preferences$/gm,
                                          '</div></div><div class="alert alert-warning mt-3 mb-0 small"><i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Note about your preferences:</strong> '
                                        )
                                        .replace(
                                          /Explain that while these don't match the (.*?) theme, we'll notify when more relevant content is available\./g,
                                          "While these articles don't perfectly match your \"$1\" theme, we'll notify you when more relevant content becomes available.</div>"
                                        ),
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <h4 className="mb-3">News Articles</h4>
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
                                          // Prevent infinite error loop
                                          e.target.onerror = null;
                                          // Use a data URI as fallback instead of external placeholder
                                          e.target.src =
                                            "data:image/svg+xml;charset=UTF-8,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' alignment-baseline='middle' font-family='system-ui, sans-serif' fill='%23adb5bd'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                                        }}
                                      />
                                    )}
                                    <div className="card-body">
                                      <h5 className="card-title">
                                        {news.title}
                                      </h5>
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
