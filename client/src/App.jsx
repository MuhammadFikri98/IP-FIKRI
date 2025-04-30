import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Edit from "./pages/Edit";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<MainLayout />}>
            {/* Halaman Home */}
            <Route path="/" element={<Home />} />
            {/* Halaman Edit Collection */}
            <Route path="/edit/:id" element={<Edit />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
