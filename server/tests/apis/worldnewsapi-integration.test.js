const NewsController = require("../controllers/NewsController");
const axios = require("axios");
const { Collection } = require("../models");

// Membuat mock untuk kebutuhan testing
jest.mock("axios");
jest.mock("../models");
jest.mock("../helpers/gemini", () => ({
  generateContent: jest
    .fn()
    .mockResolvedValue(
      "# AI Recommendation Mock\n\nIni adalah rekomendasi dari AI"
    ),
}));

describe("World News API Integration Test", () => {
  // Mock data pengguna dan koleksi
  const mockUser = { id: 1 };
  const mockCollection = {
    country: "Indonesia",
    language: "Indonesian",
    theme: "Technology",
  };

  beforeEach(() => {
    // Reset semua mock
    jest.clearAllMocks();

    // Setup mock collection
    Collection.findAll = jest.fn().mockResolvedValue([mockCollection]);
  });

  it("harus berhasil fetch data dari World News API dan memproses dengan benar", async () => {
    // Mock response dari World News API
    const mockApiResponse = {
      data: {
        news: [
          {
            id: "123",
            title: "Perkembangan Teknologi AI di Indonesia",
            text: "Artikel tentang perkembangan teknologi AI di Indonesia tahun 2025",
            summary: "Rangkuman tentang teknologi AI",
            url: "https://example.com/tech/ai-indonesia",
            image: "https://example.com/images/ai.jpg",
            publish_date: "2025-04-30T12:00:00Z",
            source: "Tech News Indonesia",
            categories: ["technology", "artificial intelligence", "indonesia"],
            sentiment: "positive",
          },
        ],
      },
    };

    axios.get.mockResolvedValue(mockApiResponse);

    // Mock request dan response untuk testing
    const req = { user: mockUser };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    // Panggil fungsi controller
    await NewsController.getRecommendedNews(req, res, next);

    // Verifikasi axios dipanggil dengan parameter yang benar
    expect(axios.get).toHaveBeenCalled();
    expect(axios.get.mock.calls[0][0]).toContain(
      "api.worldnewsapi.com/search-news"
    );
    expect(axios.get.mock.calls[0][0]).toContain("text=Technology");

    // Verifikasi response yang diberikan ke client
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();

    // Verifikasi data yang dikirim ke client memiliki format yang benar
    const responseData = res.json.mock.calls[0][0];
    expect(responseData).toHaveProperty("news");
    expect(responseData).toHaveProperty("aiRecommendation");
    expect(responseData).toHaveProperty("userPreferences");

    // Verifikasi data artikel diproses dengan benar
    const firstArticle = responseData.news[0];
    expect(firstArticle).toHaveProperty(
      "title",
      "Perkembangan Teknologi AI di Indonesia"
    );
    expect(firstArticle).toHaveProperty("url");
    expect(firstArticle).toHaveProperty("urlToImage");
  });

  it("harus menggunakan mock data jika API key tidak tersedia", async () => {
    // Simpan nilai API key asli
    const originalApiKey = process.env.WORLD_NEWS_API_KEY;
    // Hapus API key untuk testing
    delete process.env.WORLD_NEWS_API_KEY;

    // Mock request dan response
    const req = { user: mockUser };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    // Panggil fungsi controller
    await NewsController.getRecommendedNews(req, res, next);

    // Verifikasi axios tidak dipanggil
    expect(axios.get).not.toHaveBeenCalled();

    // Verifikasi response menggunakan mock data
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();

    const responseData = res.json.mock.calls[0][0];
    expect(responseData).toHaveProperty("news");
    expect(responseData).toHaveProperty(
      "message",
      "Using demo data (API key not configured)"
    );

    // Kembalikan API key
    process.env.WORLD_NEWS_API_KEY = originalApiKey;
  });
});
