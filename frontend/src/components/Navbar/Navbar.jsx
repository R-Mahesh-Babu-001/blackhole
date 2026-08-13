import { Link, NavLink } from "react-router";

import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      {/*
        BlackHole stays at the far left.

        Link gives us React Router navigation instead
        of reloading the complete browser document.
      */}
      <Link
        to="/"
        className="navbar-logo"
      >
        BlackHole
      </Link>


      {/*
        Simple navigation.

        No dropdowns anywhere.
      */}
      <div className="navbar-links">

        <NavLink
          to="/converter"
          className={({ isActive }) =>
            isActive
              ? "navbar-link navbar-link-active"
              : "navbar-link"
          }
        >
          Converter
        </NavLink>


        <NavLink
          to="/notes"
          className={({ isActive }) =>
            isActive
              ? "navbar-link navbar-link-active"
              : "navbar-link"
          }
        >
          Notes
        </NavLink>


        <NavLink
          to="/lab"
          className={({ isActive }) =>
            isActive
              ? "navbar-link navbar-link-active"
              : "navbar-link"
          }
        >
          Lab
        </NavLink>

      </div>

    </nav>
  );
}

export default Navbar;