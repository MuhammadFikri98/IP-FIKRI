import React from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import countries from "../../../buat di client nanti/country.json";
import languages from "../../../buat di client nanti/language.json";
import { deleteCollection } from "../store/collectionsSlice";

export default function Card({ collection, index, onRefresh }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDeleteCollection = async (collectionId) => {
    try {
      // Konfirmasi penghapusan dengan SweetAlert2
      const result = await Swal.fire({
        title: "Anda yakin?",
        text: "Koleksi yang dihapus tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      });

      // Jika pengguna membatalkan, tidak melakukan apa-apa
      if (!result.isConfirmed) {
        return;
      }

      // Dispatch the delete collection action
      await dispatch(deleteCollection(collectionId)).unwrap();

      // Panggil fungsi refresh jika ada
      if (onRefresh) {
        onRefresh();
      }

      // Tampilkan notifikasi sukses
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Koleksi telah dihapus",
        confirmButtonColor: "#1a3a6c",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Delete collection error:", error);

      // Tampilkan pesan error
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error || "Gagal menghapus koleksi",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${collection.id}`);
  };

  return (
    <div
      className="card h-100 border-start border-4"
      style={{ borderLeftColor: "#1a3a6c" }}
    >
      <div className="card-header bg-light d-flex align-items-center">
        <div
          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
          style={{
            width: "28px",
            height: "28px",
            minWidth: "28px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {index + 1}
        </div>
        <h5 className="card-title mb-0">
          <i className="bi bi-collection me-2 text-primary"></i>
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <div
              className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
              style={{ width: "24px", height: "24px" }}
            >
              <i className="bi bi-globe text-white small"></i>
            </div>
            <strong>Negara:</strong>
          </div>
          <div className="ms-4">
            <span className="badge bg-primary me-1">
              {countries.find((c) => c.code === collection.country)?.country ||
                collection.country}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <div
              className="rounded-circle bg-success d-flex align-items-center justify-content-center me-2"
              style={{ width: "24px", height: "24px" }}
            >
              <i className="bi bi-translate text-white small"></i>
            </div>
            <strong>Bahasa:</strong>
          </div>
          <div className="ms-4">
            <span className="badge bg-success me-1">
              {languages.find((l) => l.code === collection.language)
                ?.language || collection.language}
            </span>
          </div>
        </div>

        <div className="mb-2">
          <div className="d-flex align-items-center mb-2">
            <div
              className="rounded-circle bg-danger d-flex align-items-center justify-content-center me-2"
              style={{ width: "24px", height: "24px" }}
            >
              <i className="bi bi-tags text-white small"></i>
            </div>
            <strong>Tema:</strong>
          </div>
          <div className="ms-4">
            <span className="badge bg-danger me-1">{collection.theme}</span>
          </div>
        </div>
      </div>
      <div className="card-footer bg-transparent d-flex justify-content-between align-items-center">
        <small className="text-muted">
          Dibuat: {new Date(collection.createdAt).toLocaleDateString()}
        </small>
        <div>
          <button
            className="btn btn-sm btn-outline-primary me-1"
            title="Edit koleksi"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            title="Hapus koleksi"
            onClick={() => handleDeleteCollection(collection.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
