import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../layout/Topbar";
import Navbar from "../layout/Navbar";
import DocumentViewerLayout from "../layout/DocumentViewerLayout";
import { FileText, ArrowLeft } from "lucide-react";
import AnnotationLayer from "./AnnotationLayer";
import AnnotationPropertiesPanel from "./AnnotationPropertiesPanel";

import mockAnalysisData from "../data/mockAnalysisData";
import { ocrToPdfPixels } from "../../utils/coordinateUtils";
import PdfViewer from "./PdfViewer";


const DocumentViewer = ({ files }) => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [activeFile, setActiveFile] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const viewerWrapperRef = useRef(null);
  const [pageRect, setPageRect] = useState(null);
  const [activeTab, setActiveTab] = useState("annotation");
  const [loading, setLoading] = useState(false);

  // For demo, assume PDF is 1000x1000, rendered as 800x1000
  const pdfSize = { width: 1000, height: 1000 };
  const renderSize = { width: 800, height: 1000 };

  // Heights for fixed bars
  const NAVBAR_HEIGHT = 56; // px
  const TOPBAR_HEIGHT = 48; // px

  useEffect(() => {
    if (files && files.length > 0 && fileId !== undefined) {
      setActiveFile(files[fileId]);
    }
  }, [files, fileId]);

  useEffect(() => {
    setPageRect({ left: 0, top: 0, width: renderSize.width, height: renderSize.height });
  }, [activeFile]);

  // Run annotation (use local JSON)
  const runAnnotation = () => {
    setLoading(true);
    setTimeout(() => {
      // Use actual rendered PDF size
      const pdfRenderSize = { width: renderSize.width, height: renderSize.height };
      const ocrImageSize = { width: 4767, height: 3367 };

      const anns = (mockAnalysisData || []).map((item, idx) => {
        const bbox = item.bbox || {};
        const { x, y, width, height } = ocrToPdfPixels(bbox, ocrImageSize, pdfRenderSize);
        return {
          id: item.id ?? `${Date.now()}-${idx}`,
          type: "box",
          x, y, width, height,
          label: item.label ?? item.class ?? "Unknown",
          confidence: item.confidence ?? null,
          fields: { metadata: item.metadata ?? {} },
        };
      });

      setAnnotations(anns);
      setActiveTab("annotation");
      setLoading(false);
    }, 800); // Simulate delay
  };

  const handleBack = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!viewerWrapperRef.current) return;
    const wrapper = viewerWrapperRef.current;

    let timerId = null;
    let retries = 0;

    const updatePageRect = () => {
      const nodeList = wrapper.querySelectorAll('.rpv-core__page, .rpv-core__innerPage, [data-page-number]');
      let chosen = null;
      let maxArea = 0;

      nodeList.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area > maxArea) {
          maxArea = area;
          chosen = el;
        }
      });

      if (chosen) {
        const pageR = chosen.getBoundingClientRect();
        const wrapperR = wrapper.getBoundingClientRect();
        setPageRect({
          left: Math.round(pageR.left - wrapperR.left),
          top: Math.round(pageR.top - wrapperR.top),
          width: Math.round(pageR.width),
          height: Math.round(pageR.height),
        });
        return;
      }

      // fallback
      setPageRect({ left: 0, top: 0, width: wrapper.clientWidth, height: wrapper.clientHeight });

      if (retries < 8) {
        retries += 1;
        timerId = window.setTimeout(updatePageRect, 250);
      }
    };

    updatePageRect();

    const ro = new ResizeObserver(updatePageRect);
    ro.observe(wrapper);
    const mo = new MutationObserver(updatePageRect);
    mo.observe(wrapper, { childList: true, subtree: true });

    window.addEventListener('resize', updatePageRect);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', updatePageRect);
      if (timerId) clearTimeout(timerId);
    };
  }, [viewerWrapperRef.current]);

  return (
    <DocumentViewerLayout>
      {/* Fixed Navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: NAVBAR_HEIGHT, background: "#f8f9fa", overflow: "hidden" }}
      >
        <Navbar />
      </div>
      {/* Fixed Topbar below Navbar */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{
          top: NAVBAR_HEIGHT,
          height: TOPBAR_HEIGHT,
          background: "#eee",
          borderBottom: "1px solid #ddd",
          overflow: "hidden"
        }}
      >
        <Topbar
          leftContent={
            <div className="flex items-center space-x-2">
              <button className="flex items-center" onClick={handleBack}>
                <ArrowLeft size={20} className="mr-2" />
              
              </button>
              <span className="font-bold text-lg">Doc Viewer</span>
            </div>
          }
         
        />
      </div>
      {/* Only this area is scrollable */}
      <div
        className="w-full"
        style={{
          position: "absolute",
          top: NAVBAR_HEIGHT + TOPBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#f8f9fa",
        }}
      >
        <div className="h-full p-4">
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* PDF + Annotation Layer */}
            <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col relative min-h-[500px] h-full">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  P&ID Annotation
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold"
                    onClick={() => {
                      const newAnn = { id: Date.now().toString(), type: "box", x: 50, y: 50, width: 100, height: 60, category: "Instrument", fields: {} };
                      setAnnotations(prev => [...prev, newAnn]);
                      setSelectedAnnotationId(newAnn.id);
                    }}
                  >
                    + Add Annotation
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold"
                    onClick={runAnnotation}
                    disabled={loading || !activeFile}
                    title={!activeFile ? "Select a file to run annotation" : "Run annotation"}
                  >
                    {loading ? "Running..." : "Run Annotation"}
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="mt-4 text-gray-600">
                      Running annotation model...
                    </div>
                  </div>
                ) : activeFile && activeFile.name ? (
                  <div
                    className="relative h-full"
                    ref={viewerWrapperRef}
                    style={{ minHeight: 500 }}
                  >
                    <PdfViewer fileUrl={activeFile.url} fileName={activeFile.name} />
                    {pageRect && (
                      <div
                        className="annotation-overlay"
                        style={{
                          position: "absolute",
                          left: pageRect.left,
                          top: pageRect.top,
                          width: pageRect.width,
                          height: pageRect.height,
                          pointerEvents: "auto",
                          zIndex: 100,
                        }}
                      >
                        <AnnotationLayer
                          annotations={annotations}
                          onUpdate={(id, updatedAnn) => {
                            setAnnotations(prev =>
                              prev.map(a => a.id === id ? updatedAnn : a)
                            );
                          }}
                          onAdd={newAnn => {
                            const ann = {
                              ...newAnn,
                              id: Date.now().toString(),
                              label: newAnn.label || "New Annotation",
                              fields: {},
                            };
                            setAnnotations(prev => [...prev, ann]);
                            setSelectedAnnotationId(ann.id);
                          }}
                          selectedAnnotationId={selectedAnnotationId}
                          setSelectedAnnotationId={setSelectedAnnotationId}
                          width={pageRect?.width || 800}
                          height={pageRect?.height || 1000}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FileText size={48} className="mb-4" />
                    <div>No PDF available for annotation</div>
                  </div>
                )}
              </div>
            </div>
            {/* Right panel: annotation properties */}
            <div className="w-full lg:w-80 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-base font-bold text-gray-800">Annotation Properties</h4>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {selectedAnnotationId ? (
                  <AnnotationPropertiesPanel
                    annotation={annotations.find(a => a.id === selectedAnnotationId)}
                    onSave={updatedFields => {
                      setAnnotations(prev =>
                        prev.map(a =>
                          a.id === selectedAnnotationId
                            ? { ...a, fields: { ...a.fields, ...updatedFields }, label: updatedFields.label }
                            : a
                        )
                      );
                      setSelectedAnnotationId(null); // Hide panel after save
                    }}
                    onDelete={id => {
                      setAnnotations(prev => prev.filter(a => a.id !== id)); // Remove annotation
                      setSelectedAnnotationId(null); // Hide panel after delete
                    }}
                  />
                ) : (
                  <div className="text-gray-500 text-sm">Select an annotation to see details</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DocumentViewerLayout>
  );
};

export default DocumentViewer;

