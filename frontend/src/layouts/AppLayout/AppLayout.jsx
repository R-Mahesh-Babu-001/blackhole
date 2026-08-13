import { Outlet } from "react-router";

import BackgroundVideo from "../../components/BackgroundVideo/BackgroundVideo";
import Navbar from "../../components/Navbar/Navbar";

import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">

      {/*
        These two components live OUTSIDE the route outlet.

        This is important because changing pages should not
        restart the BlackHole background or remove the navbar.
      */}
      <BackgroundVideo />

      <Navbar />


      {/*
        React Router only changes whatever is rendered here.

        Home → Converter → Notes → Lab
      */}
      <main className="route-content">
        <Outlet />
      </main>

    </div>
  );
}

export default AppLayout;