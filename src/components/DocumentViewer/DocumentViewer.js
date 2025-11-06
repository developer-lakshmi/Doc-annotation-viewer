import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../layout/Topbar';
import Navbar from '../layout/Navbar';
import DocumentViewerLayout from '../layout/DocumentViewerLayout';
import { FileText, ArrowLeft } from 'lucide-react';
import AnnotationLayer from './AnnotationLayer';
import AnnotationPropertiesPanel from './AnnotationPropertiesPanel';

import mockAnalysisData from '../data/mockAnalysisData';
import PdfViewer from './PdfViewer';

const DocumentViewer = ({ files }) => {
  const { fileId } = useParams();
  const navigate = useNavigate();

  const [activeFile, setActiveFile] = useState(null);

  // Store annotations in NORMALIZED center-based coords (0..1)
  // shape: { id, label, type: 'box', bbox: { x_center, y_center, width, height }, fields, ... }
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);

  const viewerWrapperRef = useRef(null);

  // The react-pdf-viewer page element (portal target)
  const [pageEl, setPageEl] = useState(null);

  // Current rendered page size (after zoom)
  const [pageRect, setPageRect] = useState(null);

  const [loading, setLoading] = useState(false);

  // Heights for fixed bars
  const NAVBAR_HEIGHT = 56; // px
  const TOPBAR_HEIGHT = 48; // px

  // Load active file from route
  useEffect(() => {
    if (files && files.length > 0 && fileId !== undefined) {
      const idx = Number(fileId);
      setActiveFile(files[idx]);
    }
  }, [files, fileId]);

  // Pick only page layer (preferred), else canvas layer (never text layer)
  const pickPageEl = (wrapper) => {
    if (!wrapper) return null;
    const page = wrapper.querySelector('.rpv-core__page-layer');
    if (page) return page;
    const canvas = wrapper.querySelector('.rpv-core__canvas-layer');
    return canvas || null;
  };

  // Find inner page element and track its size (so overlay scales with zoom)
  useEffect(() => {
    const wrapper = viewerWrapperRef.current;
    if (!wrapper) return;

    let rafId = 0;

    const measure = () => {
      const el = pageEl || pickPageEl(wrapper);
      if (el) {
        if (!pageEl) setPageEl(el);
        const r = el.getBoundingClientRect();
        setPageRect({ width: Math.round(r.width), height: Math.round(r.height) });
      }
      rafId = requestAnimationFrame(measure);
    };

    // Observe DOM changes (page mount/zoom may recreate nodes)
    const mo = new MutationObserver(() => {
      const el = pickPageEl(wrapper);
      if (el && el !== pageEl) setPageEl(el);
    });
    mo.observe(wrapper, { childList: true, subtree: true });

    // Start measuring
    rafId = requestAnimationFrame(measure);

    // Also listen to window resize
    const onResize = () => {
      const el = pageEl || pickPageEl(wrapper);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPageRect({ width: Math.round(r.width), height: Math.round(r.height) });
    };
    window.addEventListener('resize', onResize);

    return () => {
      mo.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [activeFile, pageEl]);

  // Convert normalized → pixel boxes for current zoom
  const pixelAnnotations = useMemo(() => {
    if (!pageRect) return [];
    const W = pageRect.width;
    const H = pageRect.height;

    return annotations.map((a) => {
      const { x_center = 0, y_center = 0, width = 0, height = 0 } = a.bbox || {};
      const w = width * W;
      const h = height * H;
      const x = (x_center - width / 2) * W;
      const y = (y_center - height / 2) * H;
      // Snap to integers to reduce sub-pixel blur
      return {
        ...a,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(w),
        height: Math.round(h),
      };
    });
  }, [annotations, pageRect]);

  // Mock: load normalized boxes from JSON (already normalized centers)
  const runAnnotation = () => {
    if (!pageRect) return;
    setLoading(true);
    setTimeout(() => {
      const anns = (mockAnalysisData || []).map((item, idx) => ({
        id: item.id ?? `${Date.now()}-${idx}`,
        type: 'box',
        label: item.label ?? item.class ?? 'Unknown',
        confidence: item.confidence ?? null,
        fields: { metadata: item.metadata ?? {} },
        bbox: {
          x_center: item.bbox?.x_center ?? 0,
          y_center: item.bbox?.y_center ?? 0,
          width: item.bbox?.width ?? 0,
          height: item.bbox?.height ?? 0,
        },
      }));
      setAnnotations(anns);
      setLoading(false);
    }, 120);
  };

  const handleBack = () => navigate('/');

  return (
    <DocumentViewerLayout>
      {/* Fixed Navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: NAVBAR_HEIGHT, background: '#f8f9fa', overflow: 'hidden' }}
      >
        <Navbar />
      </div>

      {/* Fixed Topbar below Navbar */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{
          top: NAVBAR_HEIGHT,
          height: TOPBAR_HEIGHT,
          background: '#eee',
          borderBottom: '1px solid #ddd',
          overflow: 'hidden',
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

      {/* Single scroll area (avoid double scrollbars) */}
      <div
        className="w-full"
        style={{
          position: 'absolute',
          top: NAVBAR_HEIGHT + TOPBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto',
          background: '#f8f9fa',
        }}
      >
        <div className="h-full p-4">
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* PDF + Annotation Layer */}
            <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col relative min-h-[500px] h-full">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">P&ID Annotation</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold"
                    onClick={() => {
                      // Add a manual normalized box roughly near top-left
                      const ann = {
                        id: Date.now().toString(),
                        type: 'box',
                        label: 'New Annotation',
                        fields: {},
                        bbox: {
                          x_center: 0.1,
                          y_center: 0.1,
                          width: 0.1,
                          height: 0.06,
                        },
                      };
                      setAnnotations((prev) => [...prev, ann]);
                      setSelectedAnnotationId(ann.id);
                    }}
                  >
                    + Add Annotation
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold"
                    onClick={runAnnotation}
                    disabled={loading || !activeFile}
                    title={!activeFile ? 'Select a file to run annotation' : 'Run annotation'}
                  >
                    {loading ? 'Running...' : 'Run Annotation'}
                  </button>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="mt-4 text-gray-600">Running annotation model...</div>
                  </div>
                ) : activeFile && activeFile.name ? (
                  <div className="relative h-full" ref={viewerWrapperRef} style={{ minHeight: 500 }}>
                    <PdfViewer fileUrl={activeFile.url} fileName={activeFile.name} />

                    {/* Portal overlay inside the PAGE (or canvas) layer so it scrolls/zooms together */}
                    {pageEl && pageRect &&
                      createPortal(
                        <div
                          className="annotation-overlay"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'auto',
                            zIndex: 1000,
                            willChange: 'transform',
                            // prevent opacity inheritance / weird blending from PDF layers
                            opacity: 1,
                            mixBlendMode: 'normal',
                            isolation: 'isolate',
                          }}
                        >
                          <AnnotationLayer
                            // Pass PIXEL-CONVERTED boxes for current zoom
                            annotations={pixelAnnotations}
                            onUpdate={(id, updatedPixelAnn) => {
                              // Map pixel updates back to normalized, so future zoom stays correct
                              if (!pageRect) return;
                              const W = pageRect.width;
                              const H = pageRect.height;
                              setAnnotations((prev) =>
                                prev.map((a) => {
                                  if (a.id !== id) return a;
                                  const nx = (updatedPixelAnn.x + updatedPixelAnn.width / 2) / W;
                                  const ny = (updatedPixelAnn.y + updatedPixelAnn.height / 2) / H;
                                  const nw = updatedPixelAnn.width / W;
                                  const nh = updatedPixelAnn.height / H;
                                  return {
                                    ...a,
                                    label: updatedPixelAnn.label ?? a.label,
                                    bbox: {
                                      x_center: nx,
                                      y_center: ny,
                                      width: nw,
                                      height: nh,
                                    },
                                  };
                                })
                              );
                            }}
                            onAdd={(newPixelAnn) => {
                              if (!pageRect) return;
                              const W = pageRect.width;
                              const H = pageRect.height;
                              const ann = {
                                id: Date.now().toString(),
                                label: newPixelAnn.label || 'New Annotation',
                                fields: {},
                                type: 'box',
                                bbox: {
                                  x_center: (newPixelAnn.x + newPixelAnn.width / 2) / W,
                                  y_center: (newPixelAnn.y + newPixelAnn.height / 2) / H,
                                  width: newPixelAnn.width / W,
                                  height: newPixelAnn.height / H,
                                },
                              };
                              setAnnotations((prev) => [...prev, ann]);
                              setSelectedAnnotationId(ann.id);
                            }}
                            selectedAnnotationId={selectedAnnotationId}
                            setSelectedAnnotationId={setSelectedAnnotationId}
                            width={pageRect.width}
                            height={pageRect.height}
                          />
                        </div>,
                        pageEl
                      )
                    }
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
                    annotation={annotations.find((a) => a.id === selectedAnnotationId)}
                    onSave={(updatedFields) => {
                      setAnnotations((prev) =>
                        prev.map((a) =>
                          a.id === selectedAnnotationId
                            ? { ...a, fields: { ...a.fields, ...updatedFields }, label: updatedFields.label }
                            : a
                        )
                      );
                      setSelectedAnnotationId(null);
                    }}
                    onDelete={(id) => {
                      setAnnotations((prev) => prev.filter((a) => a.id !== id));
                      setSelectedAnnotationId(null);
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

      {/* Optional: tiny inline style to improve crispness */}
      <style>{`
        .annotation-overlay * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </DocumentViewerLayout>
  );
};

export default DocumentViewer;
