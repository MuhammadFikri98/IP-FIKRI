import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Halaman Home */}
          <Route path="/" element={<Home />} />

          {/* Auth Routes - tanpa AuthLayout untuk testing */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
