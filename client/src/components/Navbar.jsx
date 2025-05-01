import { Link, useNavigate } from "react-router-dom";

// props bentuknya object
export default function Navbar(props) {
  // console.log(props, "<<< props");
  // const { isLoggedIn } = props;

  // Always show logout button if access_token exists in localStorage
  const isLoggedIn = localStorage.getItem("access_token") ? true : false;

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <>
      {/* Navbar dengan tema biru */}
      <header
        className="navbar sticky-top flex-md-nowrap p-0 shadow"
        id="navbar"
        style={{
          backgroundColor: "#1a3a6c",
          color: "white",
        }}
      >
        <div className="container-fluid">
          <a
            onClick={() => navigate("/")}
            className="navbar-brand me-0 px-3 fs-6 text-white"
            style={{ cursor: "pointer" }}
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyq39em67_SncwnlkF9OQN90FuLgb292LzZDKCvqtjCXo0hlgdsA&s=10&ec=72940545"
              width={50}
              className="d-inline-block me-2"
              alt="NEWS GenAI"
              style={{
                borderRadius: "50%",
                border: "2px solid white",
                backgroundColor: "white",
              }}
            />
            <span className="fw-bold">NEWS GenAI</span>
          </a>

          <div className="d-flex align-items-center">
            <Link
              to="/"
              className="nav-link px-3 text-white"
              style={{
                transition: "all 0.3s ease",
                fontWeight: "500",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#8bb5ff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "white")}
            >
              <i className="bi bi-house-door me-1"></i> Home
            </Link>

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="btn btn-outline-light ms-2"
                style={{
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.color = "#1a3a6c";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "white";
                }}
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            )}
          </div>
        </div>
      </header>
      {/* End Navbar */}
    </>
  );
}
