import React, { useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";

const AnnotationLayer = ({
  annotations,
  onUpdate,
  onAdd,
  selectedAnnotationId,
  setSelectedAnnotationId,
  width,
  height
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef();
  const trRef = useRef();
  const [drawing, setDrawing] = useState(false);
  const [newRect, setNewRect] = useState(null);

  // Select and attach transformer
  const handleSelect = (id, e) => {
    e.cancelBubble = true;
    setSelectedId(id);
    setSelectedAnnotationId(id); // <-- This updates the parent state
    const shape = e.target;
    trRef.current.nodes([shape]);
    trRef.current.getLayer().batchDraw();
  };

  // Drag existing boxes
  const handleDragEnd = (e, ann) => {
    const { x, y } = e.target.attrs;
    onUpdate(ann.id, { ...ann, x, y });
  };

  // Resize existing boxes
  const handleTransformEnd = (e, ann) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const newAttrs = {
      ...ann,
      x: node.x(),
      y: node.y(),
      width: node.width() * scaleX,
      height: node.height() * scaleY,
    };
    onUpdate(ann.id, newAttrs);
  };

  // Start drawing new box
  const handleMouseDown = (e) => {
    if (e.target !== e.target.getStage()) return;
    setDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setNewRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  // Resize new box while drawing
  const handleMouseMove = (e) => {
    if (!drawing) return;
    const pos = e.target.getStage().getPointerPosition();
    const w = pos.x - newRect.x;
    const h = pos.y - newRect.y;
    setNewRect({ ...newRect, width: w, height: h });
  };

  // Finish drawing box
  const handleMouseUp = () => {
    if (drawing && newRect.width !== 0 && newRect.height !== 0) {
      onAdd(newRect);
    }
    setDrawing(false);
    setNewRect(null);
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {annotations.map((ann) => (
          <React.Fragment key={ann.id}>
            <Rect
              x={ann.x}
              y={ann.y}
              width={ann.width}
              height={ann.height}
              stroke={ann.id === selectedId ? "red" : "blue"}
              strokeWidth={2}
              draggable
              onClick={(e) => {
                handleSelect(ann.id, e);
                if (typeof window.setSelectedAnnotationId === "function") {
                  window.setSelectedAnnotationId(ann.id);
                }
              }}
              onDragEnd={(e) => handleDragEnd(e, ann)}
              onTransformEnd={(e) => handleTransformEnd(e, ann)}
            />
            <Text
              x={ann.x}
              y={ann.y - 18}
              text={(ann.fields?.label || ann.label)}
              fontSize={10}
              fontStyle="bold"
              fill={ann.id === selectedId ? "green" : "red"} // red if selected, dark gray otherwise
              padding={4}
              align="center"
              verticalAlign="middle"
              // Add background for readability
              background="#fff"
              // Optionally, add a shadow for contrast
              shadowColor="#fff"
              shadowBlur={2}
            />
          </React.Fragment>
        ))}

        {newRect && (
          <Rect
            x={newRect.x}
            y={newRect.y}
            width={newRect.width}
            height={newRect.height}
            stroke="green"
            dash={[4, 4]}
          />
        )}

        <Transformer ref={trRef} />
      </Layer>
    </Stage>
  );
};

export default AnnotationLayer;
