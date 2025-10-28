import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { setImageAnnotation } from "../../../../redux/slices/annotation/annotationSlice";
import AnnotationLayer from './AnnotationLayer';
import ActionButtons from "./ActionButtons"; // adjust path as needed

const viewerBg = isFullscreen => ({
    width: "100%",
    height: isFullscreen ? "100vh" : "80vh",
    background: "#f8f9fa",
    borderRadius: isFullscreen ? 0 : 8,
    boxShadow: isFullscreen ? "none" : "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    position: isFullscreen ? "fixed" : "relative",
    top: isFullscreen ? 0 : undefined,
    left: isFullscreen ? 0 : undefined,
    zIndex: isFullscreen ? 9999 : "auto",
    overflow: "hidden",
    minWidth: 0,
    minHeight: 0,
});

const ImageViewer = React.forwardRef((props, ref) => {
    const {
        fileUrl,
        fileName,
        zoom,
        setZoom,
        onZoomIn,
        onZoomOut,
        annotateMode,
        setAnnotateMode,
        isFullscreen,
        onFullscreen,
        annotationCategory,
        annotations,
        setAnnotations,
        annotationMode,
    } = props;
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [imageObj, setImageObj] = useState(null);
    const [rects, setRects] = useState([]); // [{x, y, width, height, label}]
    const [drawing, setDrawing] = useState(false);
    const [newRect, setNewRect] = useState(null);
    const [labelInput, setLabelInput] = useState("");
    const [showLabelInput, setShowLabelInput] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, idx: null });
    const stageRef = useRef();
    const containerRef = useRef();
    const imgRef = useRef();

    // Add state for image natural size and base zoom:
    const [imgNaturalSize, setImgNaturalSize] = useState({ width: 800, height: 600 });
    const [baseZoom, setBaseZoom] = useState(1);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [showZoomOverlay, setShowZoomOverlay] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const selectedCategoryId = useSelector(state => state.annotation.selectedCategoryId); // <-- Use Redux state directly

    const dispatch = useDispatch();
    const annotationState = useSelector(state => state.annotation);
  const coco = useSelector(state => state.annotation.coco); // from Redux

    // Get COCO annotations and visible categories from Redux
    const visibleCategories = useSelector(state => state.annotation.visibleCategories);

    // Map category_id to color
    const categoryColors = {
  1: "#1976d2", // Instrument (blue)
  2: "#e53935", // Valve (red)
  3: "#43a047", // Equipment (green)
  4: "#fbc02d", // Pipe (yellow)
};

    // Only show annotations for toggled categories
    const visibleAnnotations = coco
  ? coco.annotations.filter(a => visibleCategories.includes(a.category_id))
  : [];

    // Center image in stage
    const getImagePosition = () => {
        const imgW = imgNaturalSize.width * baseZoom * zoom;
        const imgH = imgNaturalSize.height * baseZoom * zoom;
        const x = (stageSize.width - imgW) / 2 + offset.x;
        const y = (stageSize.height - imgH) / 2 + offset.y;
        return { x, y, width: imgW, height: imgH };
    };

    // Mouse drag for pan (only while left mouse button is held)
    const handleMouseDown = e => {
        if (zoom > 1 && e.evt.button === 0) {
            setDragging(true);
            setLastPos({ x: e.evt.clientX, y: e.evt.clientY });
        }
    };
    const handleMouseMove = e => {
        if (dragging) {
            setOffset(offset => ({
                x: offset.x + (e.evt.clientX - lastPos.x),
                y: offset.y + (e.evt.clientY - lastPos.y)
            }));
            setLastPos({ x: e.evt.clientX, y: e.evt.clientY });
        }
    };
    const handleMouseUp = () => setDragging(false);
    const handleMouseLeave = () => setDragging(false);

    // Mouse wheel and touchpad zoom
    const handleWheel = e => {
        if (e.evt.ctrlKey || Math.abs(e.evt.deltaY) > Math.abs(e.evt.deltaX)) {
            e.evt.preventDefault();
            if (e.evt.deltaY < 0) setZoom(z => Math.min(z + 0.1, 5));
            else if (e.evt.deltaY > 0) setZoom(z => Math.max(z - 0.1, 0.2));
        }
    };

    const handleFullscreen = () => {
        if (onFullscreen) onFullscreen();
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(fileUrl, { mode: "cors" });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert("Failed to download image.");
        }
    };

    const handleReset = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    // Mouse events for drawing
    const handleAnnotateMouseDown = e => {
        if (!drawing && !selectedCategoryId) {
            alert("Please select a category before drawing.");
            return;
        }
        if (!drawing && selectedCategoryId) {
            const { x, y } = e.target.getStage().getPointerPosition();
            setNewRect({ x: (x - getImagePosition().x) / zoom, y: (y - getImagePosition().y) / zoom, width: 0, height: 0 });
            setDrawing(true);
        }
    };

    const handleAnnotateMouseMove = e => {
        if (!drawing || !newRect) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setNewRect({
            ...newRect,
            width: (x - getImagePosition().x) / zoom - newRect.x,
            height: (y - getImagePosition().y) / zoom - newRect.y
        });
    };

    const handleAnnotateMouseUp = () => {
        if (drawing && newRect) {
            setShowLabelInput(true);
            setDrawing(false);
        }
    };

    // Confirm label and save annotation
    const handleLabelConfirm = () => {
        if (labelInput.trim() && newRect && selectedCategoryId) {
            const updatedRects = [
                ...rects,
                { ...newRect, label: labelInput.trim(), category_id: selectedCategoryId }
            ];
            setRects(updatedRects);
            setNewRect(null);
            setLabelInput("");
            setShowLabelInput(false);

            // Save to Redux
            if (fileName) {
                dispatch(setImageAnnotation({ fileName, annotation: updatedRects }));
            }
        }
    };

    // Hover handlers
    const handleBoxMouseEnter = (id) => setHoveredIdx(id);
    const handleBoxMouseLeave = () => setHoveredIdx(null);

    // Load image
    useEffect(() => {
        if (!fileUrl) return;
        const img = new window.Image();
        img.src = fileUrl;
        img.onload = () => {
            setImageObj(img);
            setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            // Calculate base zoom to fit image inside stage
            const fitZoom = Math.min(
                stageSize.width / img.naturalWidth,
                stageSize.height / img.naturalHeight
            );
            setBaseZoom(fitZoom);
            setZoom(1); // 1 means "fit", not 1:1 pixels
            setOffset({ x: 0, y: 0 });
        };
    }, [fileUrl, stageSize]);

    // Update stage size on container resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);
    // COCO JSON output (label and coordinates only)
    const getCocoJson = () => {
        // Build a label-to-id map for unique numeric label ids
        const labelMap = {};
        let labelCounter = 1;
        rects.forEach(a => {
            if (!labelMap[a.label]) {
                labelMap[a.label] = labelCounter++;
            }
        });

        return {
            annotations: rects.map((a, idx) => {
                const width = Number(a.width);
                const height = Number(a.height);
                const x = Number(a.x);
                const y = Number(a.y);
                const center_x = x + width / 2;
                const center_y = y + height / 2;
                return {
                    id: idx + 1, // unique annotation id
                    label_id: labelMap[a.label], // unique numeric label id
                    label: a.label,
                    width,
                    height,
                    x,
                    y,
                    center_x,
                    center_y,
                    bbox: [x, y, width, height]
                };
            }),
            labels: Object.entries(labelMap).map(([label, id]) => ({ id, label }))
        };
    };

    const imagePos = getImagePosition();
    const cocoJson = getCocoJson(); // <-- renamed here
    localStorage.setItem("coco_annotations", JSON.stringify(cocoJson));
    console.log(cocoJson);

    // Handle fullscreen exit on Escape key press
    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape" || e.key === "Esc") {
                if (onFullscreen) onFullscreen(); // Exit fullscreen
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen, onFullscreen]);

    // Show zoom overlay briefly on zoom change
    useEffect(() => {
        setShowZoomOverlay(true);
        const timer = setTimeout(() => setShowZoomOverlay(false), 1500);
        return () => clearTimeout(timer);
    }, [zoom]);

    // Load annotations from Redux on fileName change
    useEffect(() => {
        if (fileName && annotationState[fileName]) {
            setRects(annotationState[fileName]);
        }
    }, [fileName, annotationState]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(c => ({ ...c, visible: false }));
        if (contextMenu.visible) {
            window.addEventListener("click", handleClick);
            return () => window.removeEventListener("click", handleClick);
        }
    }, [contextMenu.visible]);

    const handleSave = () => {
        const blob = new Blob([JSON.stringify(cocoJson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "annotations.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const fit = (() => {
  const { width: cW, height: cH } = containerSize;
  const { width: iW, height: iH } = imgNaturalSize;
  if (!iW || !iH) return { width: 0, height: 0, left: 0, top: 0 };
  const scale = Math.min(cW / iW, cH / iH) * zoom;
  const width = iW * scale;
  const height = iH * scale;
  return {
    width,
    height,
    left: (cW - width) / 2,
    top: (cH - height) / 2
  };
})();

    const handleReprocess = () => {
  // TODO: Implement your process logic here
  alert("Process action triggered!");
};

const handleApprove = () => {
  // TODO: Implement your approve logic here
  alert("Approve action triggered!");
};

    // Download annotated image as PDF
    const handleDownloadAnnotated = async () => {
        if (!containerRef.current) return;
        await new Promise(r => setTimeout(r, 100));
        const html2canvas = (await import("html2canvas")).default;
        const jsPDF = (await import("jspdf")).default;
        const canvas = await html2canvas(containerRef.current, { backgroundColor: "#fff", useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("annotated.pdf");
    };

    useImperativeHandle(ref, () => ({
        download: handleDownloadAnnotated
    }));

    return (
        <div ref={containerRef} style={viewerBg(props.isFullscreen)}>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: isFullscreen ? "100vh" : "80vh",
              position: "relative",
              background: "#f8f9fa",
              borderRadius: isFullscreen ? 0 : 8,
              boxShadow: isFullscreen ? "none" : "0 2px 8px rgba(0,0,0,0.05)",
              overflow: "hidden",
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {/* Displayed image */}
            <img
              ref={imgRef}
              src={fileUrl}
              alt={fileName}
              style={{
                position: "absolute",
                left: fit.left,
                top: fit.top,
                width: fit.width,
                height: fit.height,
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
                zIndex: 1,
              }}
              draggable={false}
              onLoad={e => setImgNaturalSize({
                width: e.target.naturalWidth,
                height: e.target.naturalHeight,
              })}
            />
            {/* Annotation overlay */}
            <div
              style={{
                position: "absolute",
                left: fit.left,
                top: fit.top,
                width: fit.width,
                height: fit.height,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <AnnotationLayer
                width={fit.width}
                height={fit.height}
                annotations={annotations}
                setAnnotations={setAnnotations}
                annotationMode={annotationMode}
                category={annotationCategory}
                annotateMode={annotateMode}
              />
            </div>
          </div>
            {/* Label input overlay */}
            {showLabelInput && newRect && (
                <div
                    style={{
                        position: "absolute",
                        left: imagePos.x + Math.min(newRect.x, newRect.x + newRect.width) * zoom,
                        top: imagePos.y + Math.min(newRect.y, newRect.y + newRect.height) * zoom - 36,
                        background: "#fff",
                        border: "1px solid #1976d2",
                        borderRadius: 4,
                        padding: "2px 6px",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                        fontSize: 14,
                    }}
                >
                    <input
                        type="text"
                        value={labelInput}
                        onChange={e => setLabelInput(e.target.value)}
                        placeholder="Enter label"
                        style={{
                            fontSize: 13,
                            padding: "2px 6px",
                            border: "1px solid #ccc",
                            borderRadius: 3,
                            outline: "none",
                            width: 90,
                        }}
                        autoFocus
                    />
                    <button
                        onClick={handleLabelConfirm}
                        style={{
                            background: "#1976d2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 14,
                            marginLeft: 2,
                        }}
                        title="OK"
                    >✔</button>
                    <button
                        onClick={() => { setShowLabelInput(false); setNewRect(null); }}
                        style={{
                            background: "#fff",
                            color: "#d32f2f",
                            border: "1px solid #d32f2f",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 14,
                            marginLeft: 2,
                        }}
                        title="Cancel"
                    >✕</button>
                </div>
            )}
            {showZoomOverlay && (
                <div style={{
                    position: "absolute",
                    bottom: 12,
                    right: 16,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 13,
                    zIndex: 20
                }}>
                    {(zoom * 100).toFixed(0)}%
                </div>
            )}
            {contextMenu.visible && (
                <div
                    style={{
                        position: "fixed",
                        top: contextMenu.y + 8, // slight offset for better visibility
                        left: contextMenu.x + 8,
                        // background: "#fff",
                        // border: "1px solid #e0e0e0",
                        // borderRadius: 8,
                        zIndex: 2000,
                        // boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        padding: 0,
                        minWidth: 48,
                        minHeight: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        animation: "fadeIn 0.18s",
                        transition: "box-shadow 0.2s"
                    }}
                    onClick={() => setContextMenu({ ...contextMenu, visible: false })}
                >
                    <span
                        title="Delete annotation"
                        style={{
                            color: "#e53935",
                            fontSize: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            transition: "background 0.18s",
                            userSelect: "none"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#ffeaea"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={e => {
                            e.stopPropagation();
                            // Animate fade out (optional)
                            e.currentTarget.parentNode.style.opacity = 0;
                            setTimeout(() => {
                                const updatedRects = rects.filter((_, idx) => idx !== contextMenu.idx);
                                setRects(updatedRects);
                                setContextMenu({ ...contextMenu, visible: false });
                                // Save to Redux
                                if (fileName) {
                                    dispatch(setImageAnnotation({ fileName, annotation: updatedRects }));
                                }
                            }, 120);
                        }}
                    >
                        {/* SVG Trash Icon for better style */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#e53935"/>
                        </svg>
                    </span>
                </div>
            )}
           
            {/* Example: COCO JSON output 
           <pre>{JSON.stringify(getCocoJson(), null, 2)}</pre> */}
        </div>
    );
});

export default ImageViewer;

<style>
{`
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95);}
  to { opacity: 1; transform: scale(1);}
}
`}
</style>

const initialState = {
  coco: null,
  visibleCategories: [1, 2, 3, 4], // All ON by default
  selectedCategoryId: null,
};