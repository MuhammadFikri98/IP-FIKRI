import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import Navbar from "../components/Navbar";


export default function MainLayout() {
  // 3. kasih alert trus paksa untuk ke halaman login
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      // alert("login bos") -> diganti sama alert custom
      navigate("/login");
    }
  }, []);

  // proteksi semua halaman yg menjadi child dari MainLayout, harus login
  if (localStorage.getItem("access_token")) {
    return (
      <>
        <Navbar />
 
        {/* Outlet adalah komponent tempat anak route nya dirender */}
        <Outlet />
      </>
    );
  }

 
}
