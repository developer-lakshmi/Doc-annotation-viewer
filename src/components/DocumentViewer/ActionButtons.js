import React from "react";
import { RotateCw, CheckCircle2, Download } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";

const ActionButtons = ({
  onProcess,
  onApprove,
  onDownload,
  approveLoading,
  downloadLoading,
  isApproved,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 16,
      padding: "12px 24px 0 24px",
      background: "transparent",
      zIndex: 2,
    }}
  >
    <button
      onClick={onProcess}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#374151", // Gray 700
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "8px 20px",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 2px 8px #37415122",
        transition: "background 0.2s",
      }}
      title="Reprocess"
      disabled={approveLoading || isApproved}
    >
      <RotateCw size={18} style={{ marginRight: 4 }} />
      Reprocess
    </button>
    <button
      onClick={onApprove}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: isApproved ? "#0ea5e9" : "#0d9488", // Blue if approved, teal otherwise
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "8px 20px",
        fontWeight: 600,
        fontSize: 15,
        cursor: isApproved ? "default" : "pointer",
        boxShadow: "0 2px 8px #0d948822",
        transition: "background 0.2s",
        position: "relative",
        opacity: isApproved ? 0.85 : 1,
      }}
      title={isApproved ? "Already approved" : "Approve"}
      disabled={approveLoading || isApproved}
    >
      {approveLoading ? (
        <>
          <CircularProgress size={20} color="inherit" style={{ marginRight: 4 }} />
          Approve
        </>
      ) : isApproved ? (
        <>
          <CheckCircle2 size={18} style={{ marginRight: 4 }} />
          Approved
        </>
      ) : (
        <>
          <CheckCircle2 size={18} style={{ marginRight: 4 }} />
          Approve
        </>
      )}
    </button>
    <button
      onClick={onDownload}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#6366f1", // Indigo 500
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "8px 20px",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 2px 8px #6366f122",
        transition: "background 0.2s",
      }}
      title="Download"
      disabled={approveLoading || downloadLoading}
    >
      {downloadLoading ? (
        <>
          <CircularProgress size={20} color="inherit" style={{ marginRight: 4 }} />
          Download
        </>
      ) : (
        <>
          <Download size={18} style={{ marginRight: 4 }} />
          Download
        </>
      )}
    </button>
  </div>
);

export default ActionButtons;