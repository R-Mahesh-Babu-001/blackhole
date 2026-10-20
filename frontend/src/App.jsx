import { Navigate, Route, Routes } from "react-router";

import AppLayout from "./layouts/AppLayout/AppLayout";

import Notes from "./pages/Notes/Notes";
import Converter from "./pages/Converter/Converter";
import Lab from "./pages/Lab/Lab";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Navigate to="/notes" replace />}
        />

        <Route
          path="/converter"
          element={<Converter />}
        />

        <Route
          path="/notes"
          element={<Notes />}
        />

        <Route
          path="/lab"
          element={<Lab />}
        />

      </Route>

    </Routes>
  );
}

export default App;