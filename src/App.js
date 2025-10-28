import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import FileListPage from "./components/FileUpload/FileListPage";
import DocumentViewer from "./components/DocumentViewer/DocumentViewer";

function App() {
  const [files, setFiles] = useState([]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <FileListPage files={files} setFiles={setFiles} />
            </MainLayout>
          }
        />
        <Route
          path="/doc/:fileId"
         element={
            <MainLayout><DocumentViewer files={files} />  </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;