import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

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
        url: "https://ip-fikri-server.fikri.fun/google-login",
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
      const { data } = await axios.post(
        "https://ip-fikri-server.fikri.fun/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("access_token", data.access_token);
      navigate("/");
    } catch (error) {
      console.log(error);
      setLoginError(
        error.response?.data?.message ||
          "Login gagal. Periksa email dan password Anda."

          
      );

       Swal.fire({
              title: "Error!",
              text: error.response.data.message,
              icon: "error",
              confirmButtonText: "Close",
            });
    }
  };

  return (
    <>
      <div className="row">
        <div
          className="col-6 d-flex align-items-center justify-content-center"
          style={{ minHeight: "100vh", backgroundColor: "#1a3a6c" }}
        >
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyq39em67_SncwnlkF9OQN90FuLgb292LzZDKCvqtjCXo0hlgdsA&s=10&ec=72940545"
            alt=""
            className="img-fluid"
            style={{ maxWidth: "80%" }}
          />
        </div>
        <div
          className="col-6 d-flex align-items-center"
          style={{
            minHeight: "100vh",
            backgroundColor: "#f0f8ff",
            backgroundImage:
              "linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%)",
          }}
        >
          <form
            onSubmit={handleLogin}
            className="w-75 m-auto d-flex flex-column gap-3 p-4 rounded"
            style={{
              backgroundColor: "white",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
            }}
          >
            <h1 className="text-center" style={{ color: "#1a3a6c" }}>
              NEWS GenAI
            </h1>

            {/* Tampilkan pesan error jika ada */}
            {loginError && (
              <div className="alert alertr" role="alert">
                {loginError}
              </div>
            )}

            <div className="mb-3">
              <label
                htmlFor="exampleInputEmail1"
                className="form-label"
                style={{ color: "#1a3a6c" }}
              >
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              
                style={{ borderColor: "#4d79cc" }}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="exampleInputPassword1"
                className="form-label"
                style={{ color: "#1a3a6c" }}
              >
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="exampleInputPassword1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              
                style={{ borderColor: "#4d79cc" }}
              />
            </div>

            <button
              type="submit"
              className="btn text-white w-100"
              style={{ backgroundColor: "#1a3a6c", borderColor: "#1a3a6c" }}
            >
              Login
            </button>

            <div className="text-center my-3">
              <p style={{ color: "#1a3a6c" }}>Atau login dengan</p>
              <div className="d-flex justify-content-center">
                {/* Google login button */}
                <div id="google-btn"></div>
              </div>
            </div>

            <p className="text-center" style={{ color: "#1a3a6c" }}>
              Don't have an account yet?{" "}
              <Link
                to="/register"
                style={{
                  color: "#4d79cc",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </p>

            
          </form>
        </div>
      </div>
    </>
  );
}
