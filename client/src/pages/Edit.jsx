import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import countries from "../../../buat di client nanti/country.json";
import languages from "../../../buat di client nanti/language.json";
import themes from "../../../buat di client nanti/theme.json";
import Swal from "sweetalert2";
import {
  fetchCollectionById,
  updateCollection,
} from "../store/collectionsSlice";

export default function Edit() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  // Get collection state from Redux
  const { isLoading, error, currentCollection } = useSelector(
    (state) => state.collections
  );

  // Collection data
  const [collection, setCollection] = useState({
    country: "",
    language: "",
    theme: "",
  });

  // Fetch collection data on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    dispatch(fetchCollectionById(id))
      .unwrap()
      .then((data) => {
        setCollection(data);
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Tidak dapat mengambil data koleksi",
          confirmButtonColor: "#d33",
        });
      });
  }, [id, dispatch, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(
        updateCollection({ id, collectionData: collection })
      ).unwrap();

      Swal.fire({
        icon: "success",
        title: "Sukses!",
        text: "Koleksi berhasil diperbarui",
        confirmButtonColor: "#1a3a6c",
        timer: 2000,
        timerProgressBar: true,
      });

      // Redirect back to home page after successful update
      navigate("/");
    } catch (error) {
      console.error("Error updating collection:", error);

      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error || "Gagal memperbarui koleksi",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>Edit Koleksi
              </h3>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Mengambil data koleksi...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Negara</label>
                    <select
                      className="form-select"
                      value={collection.country}
                      onChange={(e) =>
                        setCollection({
                          ...collection,
                          country: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Pilih Negara</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bahasa</label>
                    <select
                      className="form-select"
                      value={collection.language}
                      onChange={(e) =>
                        setCollection({
                          ...collection,
                          language: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Pilih Bahasa</option>
                      {languages.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.language}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tema</label>
                    <select
                      className="form-select"
                      value={collection.theme}
                      onChange={(e) =>
                        setCollection({ ...collection, theme: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Tema</option>
                      {themes.map((theme) => (
                        <option key={theme.theme} value={theme.theme}>
                          {theme.theme}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate("/")}
                    >
                      <i className="bi bi-arrow-left me-1"></i> Kembali
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-1"></i> Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
