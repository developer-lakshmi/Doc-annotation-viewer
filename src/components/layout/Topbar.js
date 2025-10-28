import React from "react";
const Topbar = ({ leftContent, rightContent }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 48, padding: 8, background: "#eee" }}>
    <div>{leftContent}</div>
    <div>{rightContent}</div>
  </div>
);
export default Topbar;