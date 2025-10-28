import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { FileText, ArrowLeft } from "lucide-react";

 const PdfViewer = ({ fileUrl }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FileText size={48} className="mb-4" />
        <div className="text-center font-medium">No PDF file available</div>
      </div>
    );
  }
  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
      <div style={{ height: "100%", width: "100%" }}>
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </div>
    </Worker>
  );
};

export default PdfViewer;