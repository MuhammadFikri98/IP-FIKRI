import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/index.js";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Untuk development, gunakan Client ID khusus untuk localhost
// Ganti dengan Client ID valid dari Google Cloud Console
const googleClientId = "YOUR_NEW_CLIENT_ID_HERE";

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleOAuthProvider>
);
