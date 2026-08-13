import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>

    {/*
      BrowserRouter keeps navigation inside React.

      Clicking Converter, Notes or Lab does not need
      a complete browser page refresh.
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>

  </StrictMode>
);