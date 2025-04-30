import { Navigate, Outlet } from "react-router";

export default function AuthLayout() {
  // AuthLayout ini sebenarnya mencegah user yang SUDAH login untuk mengakses
  // halaman Login dan Register. Jika user sudah login, redirect ke home.
  // Jika belum login, tampilkan halaman child (Login/Register)
  if (localStorage.getItem("access_token")) {
    return <Navigate to="/" />;
  }

  // Jika tidak ada token, tampilkan halaman child (Login/Register)
  return <Outlet />;
}
