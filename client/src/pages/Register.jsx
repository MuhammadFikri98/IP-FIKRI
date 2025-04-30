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
            onSubmit={handleRegister}
            className="w-75 m-auto d-flex flex-column gap-3"
          >
            <h1 className="text-center">Hacktiv Grocery</h1>
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
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 bg-warning">
              Register
            </button>
            <p className="text-center">
              Do you have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
