import { Route, Routes } from "react-router";

import AppLayout from "./layouts/AppLayout/AppLayout";

import Home from "./pages/Home/Home";
import Converter from "./pages/Converter/Converter";
import Notes from "./pages/Notes/Notes";
import Lab from "./pages/Lab/Lab";

import "./App.css";

function App() {
  return (
    <Routes>

      {/*
        Every route below inherits AppLayout.

        Therefore every page automatically has:
        - BlackHole video
        - navbar
        - same visual system
      */}
      <Route element={<AppLayout />}>

        <Route
          path="/"
          element={<Home />}
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