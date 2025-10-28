import React from "react";
import PdfViewer from "./PdfViewer";
import AnnotationLayer from "./AnnotationLayer";
import DocumentDataTable from "./DocumentDataTable";
import { Eye } from "lucide-react";

const AnalysisPanel = ({
  fileUrl,
  isPdf,
  filesLoading,
  activeFile,
  pdfWidth = 1200,
  pdfHeight = 900,
  annotations = [],
  setAnnotations = () => {},
  analysisHtml,
  documentDataTableRef,
  files = [],
  selectedPidIds = [],
  activePidId,
  setActivePidId = () => {},
}) => {
  return (
    <div className="h-full p-4 flex gap-4">
      <div className="w-full lg:w-4/12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <Eye size={20} className="mr-2" />
            Document Preview
          </h3>
          {selectedPidIds.length > 1 && (
            <select
              className="ml-4 border rounded px-2 py-1 text-sm"
              value={activePidId}
              onChange={(e) => setActivePidId(e.target.value)}
            >
              {selectedPidIds.map((pidId) => {
                const f = files.find((f) => f.id === pidId);
                return (
                  <option key={pidId} value={pidId}>
                    {f?.name || pidId}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {filesLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mt-4 text-gray-600 dark:text-gray-400">Loading document...</div>
            </div>
          ) : activeFile && activeFile.name && isPdf ? (
            <div className="relative flex-1">
              <PdfViewer fileUrl={fileUrl} />
              {/* Analysis view: AnnotationLayer in readOnly mode.
                  IMPORTANT: AnalysisPanel must NOT call annotation API.
                  Pass annotations for display only. */}
              <AnnotationLayer
                annotations={annotations}
                setAnnotations={setAnnotations}
                readOnly={true}
                width={pdfWidth}
                height={pdfHeight}
              />
            </div>
          ) : activeFile && !isPdf ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="font-medium">Only PDF files supported</div>
                <div className="text-sm mt-1">File: {activeFile.name}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div>No document found</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <DocumentDataTable
          ref={documentDataTableRef}
          title="P&ID Analysis Results"
          subtitle="Complete analysis from uploaded document(s)"
          data={Array.isArray(analysisHtml) ? analysisHtml : [analysisHtml]}
          useHtmlData={true}
          useMockData={false}
        />
      </div>
    </div>
  );
};

export default AnalysisPanel;