import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Google OAuth handler function
  async function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);

    try {
      // Request ke server dengan format yang benar
      const { data } = await axios({
        method: "POST",
        url: "http://localhost:3000/google-login",
        data: {
          token: response.credential, // Pastikan nama parameter sesuai dengan yang diharapkan server
        },
      });

      // Simpan token ke localStorage
      localStorage.setItem("access_token", data.access_token);

      // Pindah ke halaman home
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      setLoginError(error.response?.data?.message || "Google login gagal");
    }
  }

  // Initialize Google Identity Services
  useEffect(() => {
    // Make sure Google Identity Services is loaded
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Gunakan Client ID dari .env
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        { theme: "outline", size: "large" }
      );
      window.google.accounts.id.prompt();
    } else {
      console.error("Google Identity Services not loaded");
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      // Request ke server
      const { data } = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });

      localStorage.setItem("access_token", data.access_token);
      navigate("/");
    } catch (error) {
      console.log(error);
      setLoginError(
        error.response?.data?.message ||
          "Login gagal. Periksa email dan password Anda."
      );
    }
  };

  return (
    <>
      <div className="row">
        <div
          className="col-6 d-flex align-items-center justify-content-center"
          style={{ minHeight: "100vh" }}
        >
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4o2JIRCI-C4Tkw3ulBgKprfup5xFXogeWRUGNj9IDXZbeyHNLUQ&s=10&ec=72940545"
            alt=""
          />
        </div>
        <div
          className="col-6 d-flex align-items-center bg-warning-subtle"
          style={{ minHeight: "100vh" }}
        >
          <form
            onSubmit={handleLogin}
            className="w-75 m-auto d-flex flex-column gap-3"
          >
            <h1 className="text-center">Hacktiv Grocery</h1>

            {/* Tampilkan pesan error jika ada */}
            {loginError && (
              <div className="alert alert-danger" role="alert">
                {loginError}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="exampleInputEmail1" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="exampleInputPassword1" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="exampleInputPassword1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 bg-warning">
              Login
            </button>

            <div className="text-center my-3">
              <p>Atau login dengan</p>
              <div className="d-flex justify-content-center">
                {/* Google login button */}
                <div id="google-btn"></div>
              </div>
            </div>

            <p className="text-center">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-decoration-none fw-bold">
                Register
              </Link>
            </p>

            <div className="mt-3 text-center">
              <Link to="/" className="btn btn-outline-secondary">
                Kembali ke Home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
