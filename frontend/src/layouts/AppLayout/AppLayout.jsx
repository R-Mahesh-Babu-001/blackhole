import { Outlet } from "react-router";

import Navbar from "../../components/Navbar/Navbar";

import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">
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