import * as React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import AnnotationLayer from './AnnotationLayer';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PdfViewer = React.forwardRef(({
    fileUrl,
    annotateMode,
    annotationCategory,
    annotations,
    setAnnotationMode,
    setAnnotations,
    annotationMode,
}, ref) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const [zoomLevel, setZoomLevel] = React.useState(1.0);

    // viewerRef was missing -> used by wheel handler and html2canvas
    const viewerRef = React.useRef(null);

    // For demo, set a fixed PDF canvas size (you can make this dynamic)
    const pdfWidth = 800;
    const pdfHeight = 1100;

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            let newZoom = zoomLevel + (delta > 0 ? 0.1 : -0.1);
            newZoom = Math.max(0.5, Math.min(newZoom, 3.0));
            setZoomLevel(newZoom);
        }
    };

    React.useEffect(() => {
        const container = viewerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [zoomLevel]);

    const handleDownloadAnnotated = async () => {
        if (!viewerRef.current) return;
        // Wait a tick for any overlay to render
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(viewerRef.current, { backgroundColor: "#fff", useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("annotated.pdf");
    };

    // Expose download method to parent via ref
    React.useImperativeHandle(ref, () => ({
        download: handleDownloadAnnotated
    }));

    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <div className="h-full w-full" style={{ position: "relative" }} ref={viewerRef}>
                 {/* PDF Viewer only — overlay is rendered by DocumentViewer via pageRect */}
                 <Viewer
                     fileUrl={fileUrl}
                     plugins={[defaultLayoutPluginInstance]}
                     defaultScale={zoomLevel}
                 />
             </div>
         </Worker>
     );
});

export default PdfViewer;
