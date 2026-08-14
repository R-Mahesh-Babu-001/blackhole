import {
  Link,
  NavLink,
} from "react-router";

import "./Navbar.css";


function DoorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 21H18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M7 21V4.8C7 4.35 7.35 4 7.8 4H16.2C16.65 4 17 4.35 17 4.8V21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M10 4V21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="12.7"
        cy="12.5"
        r="0.8"
        fill="currentColor"
      />
    </svg>
  );
}


function Navbar({
  assistantOpen,
  onAssistantToggle,
}) {
  return (
    <nav className="navbar">

      <Link
        to="/"
        className="navbar-logo"
      >
        BlackHole
      </Link>


      <div className="navbar-right">

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


        <button
          className={
            assistantOpen
              ? "assistant-door assistant-door-active"
              : "assistant-door"
          }
          onClick={onAssistantToggle}
          aria-label={
            assistantOpen
              ? "Close BlackHole Assistant"
              : "Open BlackHole Assistant"
          }
          title="BlackHole Assistant"
        >
          <DoorIcon />
        </button>

      </div>

    </nav>
  );
}


export default Navbar;