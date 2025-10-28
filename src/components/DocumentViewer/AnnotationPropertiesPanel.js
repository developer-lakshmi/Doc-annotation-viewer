import React, { useState } from "react";

const ANNOTATION_FIELDS = [
  { key: "label", name: "Label" },
  { key: "type", name: "Type" },
  { key: "tagNo", name: "Tag No" },
  { key: "designSpecification1", name: "Design Specification 1" },
  { key: "designSpecification2", name: "Design Specification 2" },
  { key: "designSpecification3", name: "Design Specification 3" },
  { key: "additionalSpecification1", name: "Additional Specification 1" },
  { key: "additionalSpecification2", name: "Additional Specification 2" },
  { key: "additionalSpecification3", name: "Additional Specification 3" },
];

const AnnotationPropertiesPanel = ({ annotation, onSave, onDelete }) => {
  const [fields, setFields] = useState(() => {
    const initial = {};
    ANNOTATION_FIELDS.forEach(f => {
      initial[f.key] = annotation?.fields?.[f.key] ?? annotation?.[f.key] ?? "";
    });
    return initial;
  });

  const handleChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <form className="space-y-3">
      {ANNOTATION_FIELDS.map(f => (
        <div key={f.key} className="flex flex-col">
          <label className="text-xs font-semibold mb-1">{f.name}</label>
          <input
            type="text"
            value={fields[f.key]}
            onChange={e => handleChange(f.key, e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={handleSave}
        className="mt-2 px-4 py-1 bg-green-600 text-white rounded text-sm"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onDelete(annotation.id)}
        className="mt-2 ml-2 px-4 py-1 bg-red-600 text-white rounded text-sm"
      >
        Delete
      </button>
    </form>
  );
};

export default AnnotationPropertiesPanel;