import React from "react";
import Navbar from "./Navbar";

const NAVBAR_HEIGHT = 56; // px, adjust if your Navbar is taller

const MainLayout = ({ children, showNavbar = true }) => (
  <div className="bg-[#f8f9fa] min-h-screen w-full">
    {/* Fixed Navbar, never scrolls */}
    {showNavbar && (
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{
          height: NAVBAR_HEIGHT,
          width: "100%",
        }}
      >
        <div style={{ height: NAVBAR_HEIGHT, width: "100%", overflow: "hidden" }}>
          <Navbar />
        </div>
      </div>
    )}
    {/* Scrollable main content below Navbar */}
    <main
      className="w-full overflow-auto"
      style={{
        marginTop: showNavbar ? NAVBAR_HEIGHT : 0,
        height: `calc(100vh - ${showNavbar ? NAVBAR_HEIGHT : 0}px)`,
      }}
    >
      {children}
    </main>
  </div>
);

export default MainLayout;