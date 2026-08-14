import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router";

import BackgroundVideo
  from "../../components/BackgroundVideo/BackgroundVideo";

import Navbar
  from "../../components/Navbar/Navbar";

import ChatAssistant
  from "../../components/ChatAssistant/ChatAssistant";

import "./AppLayout.css";


function AppLayout() {
  const [
    assistantOpen,
    setAssistantOpen,
  ] = useState(false);


  const toggleAssistant = () => {
    setAssistantOpen(
      (current) => !current,
    );
  };


  const closeAssistant = () => {
    setAssistantOpen(false);
  };


  return (
    <div className="app-layout">

      <BackgroundVideo />


      <Navbar
        assistantOpen={assistantOpen}
        onAssistantToggle={toggleAssistant}
      />


      <main
        className={
          assistantOpen
            ? "route-content assistant-workspace-open"
            : "route-content"
        }
      >
        <Outlet />
      </main>


      <ChatAssistant
        open={assistantOpen}
        onClose={closeAssistant}
      />

    </div>
  );
}


export default AppLayout;