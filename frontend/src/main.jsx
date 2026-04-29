import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
const API = "https://assignment1-3.onrender.com";

fetch(`${API}/developers`)