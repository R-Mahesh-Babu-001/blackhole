import { Outlet } from "react-router";

import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">
      <main className="route-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;