import React, { useRef } from "react";

const FileUpload = ({ onFiles }) => {
  const inputRef = useRef();
  return (
    <div>
      <input
        type="file"
        multiple
        ref={inputRef}
        style={{ display: "none" }}
        onChange={e => onFiles(Array.from(e.target.files))}
      />
      <button onClick={() => inputRef.current.click()}>Upload Files</button>
    </div>
  );
};

export default FileUpload;