import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      // Perbaiki URL dengan menambahkan http://
      await axios.post("http://localhost:3000/register", {
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      console.log(error);

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
            onSubmit={handleRegister}
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
              Register
            </button>

            <p className="text-center" style={{ color: "#1a3a6c" }}>
              Do you have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "#4d79cc",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                Login
              </Link>
            </p>

        
          </form>
        </div>
      </div>
    </>
  );
}
