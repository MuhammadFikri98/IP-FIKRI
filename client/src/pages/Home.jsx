import { Link } from "react-router-dom";

export default function Home() {
  // Tambahkan fungsi untuk memeriksa dan menghapus token jika perlu
  const checkAndClearToken = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      console.log("Token ditemukan di localStorage:", token);
      // Hapus token untuk debug
      localStorage.removeItem("access_token");
      console.log("Token telah dihapus");
    } else {
      console.log("Tidak ada token di localStorage");
    }
  };

  return (
    <>
      <h1>MASUK HOME</h1>
      <div>
        <Link to="/login" className="btn btn-primary me-2">
          Login
        </Link>
        <Link to="/register" className="btn btn-success">
          Register
        </Link>
      </div>

      {/* Tambahkan tombol debug untuk memeriksa token */}
      <div className="mt-3">
        <button
          onClick={checkAndClearToken}
          className="btn btn-outline-danger btn-sm"
        >
          Check/Clear Token (Debug)
        </button>
      </div>
    </>
  );
}
