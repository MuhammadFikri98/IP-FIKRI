import { Navigate, Outlet } from "react-router";

export default function AuthLayout() {
  //proteksi semual halaman yg menjadi child dari MainLayout, harus login
  if (localStorage.getItem("access_token")) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
