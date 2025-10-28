import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DocumentViewerLayout from "../layout/DocumentViewerLayout";

function FileListPage({ files, setFiles }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Load files from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("uploadedFiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFiles(parsed);
      } catch {}
    }
  }, [setFiles]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      url: URL.createObjectURL(file),
      file,
    }));
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
  };

  // Sorting logic
  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === "name") {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortBy === "size") {
      return sortAsc ? a.size - b.size : b.size - a.size;
    }
    if (sortBy === "type") {
      return sortAsc
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
    if (sortBy === "lastModified") {
      return sortAsc
        ? a.lastModified - b.lastModified
        : b.lastModified - a.lastModified;
    }
    return 0;
  });

  const formatSize = (size) => {
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <DocumentViewerLayout>
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Uploaded Documents</h2>
          <label className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg cursor-pointer shadow hover:bg-blue-700 transition text-base font-semibold">
            <span>Upload Files</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-base">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  className="px-6 py-4 text-left font-semibold text-gray-700 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  File Name
                  {sortBy === "name" && (
                    <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
                <th
                  className="px-6 py-4 text-left font-semibold text-gray-700 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("size")}
                >
                  Size
                  {sortBy === "size" && (
                    <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
                <th
                  className="px-6 py-4 text-left font-semibold text-gray-700 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("type")}
                >
                  Type
                  {sortBy === "type" && (
                    <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
                <th
                  className="px-6 py-4 text-left font-semibold text-gray-700 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("lastModified")}
                >
                  Last Modified
                  {sortBy === "lastModified" && (
                    <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedFiles.map((file, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">
                    <button
                      className="text-blue-600 hover:underline font-semibold"
                      onClick={() => navigate(`/doc/${idx}`)}
                    >
                      {file.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatSize(file.size)}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {file.type || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatDate(file.lastModified)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-base shadow"
                      onClick={() => navigate(`/doc/${idx}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xl">
                    No files uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Add Clear All button below the table */}
        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
            onClick={() => {
              setFiles([]);
              localStorage.removeItem("uploadedFiles");
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </DocumentViewerLayout>
  );
}

export default FileListPage;