import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Check, X, Edit3, AlertTriangle, CheckCircle, Clock, BarChart3, Maximize2, Minimize2 } from "lucide-react";
import { handleExport, handlePrint } from './exportUtils';
import { getAnalysisData } from './dataService';

/**
 * Document Data Table Component with built-in fullscreen functionality
 */
const DocumentDataTable = forwardRef(({ 
  data = [],
  title = "P&ID Analysis Results",
  subtitle = "Complete analysis from uploaded document",
  useHtmlData = true,
  useMockData = true,
  isFullscreen = false,
  onFullscreenToggle = null
}, ref) => {
  
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRemark, setEditingRemark] = useState(null);
  const [remarkValue, setRemarkValue] = useState('');
  const [internalFullscreen, setInternalFullscreen] = useState(false);

  // Use internal fullscreen state if no external control provided
  const isTableFullscreen = onFullscreenToggle ? isFullscreen : internalFullscreen;

  // Load data when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        
        const analysisData = await getAnalysisData(null, null, data);
        
        if (!isMounted) return;
        
        // Transform "Not" to "Pending" in the data
        const transformedData = analysisData.map(row => ({
          ...row,
          approval: row.approval === 'Not' ? 'Pending' : row.approval
        }));
        
        setTableData(transformedData);
        console.log(`Loaded ${transformedData.length} analysis records`);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Failed to load analysis data:', err);
        setError(err.message);
        setTableData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    if (onFullscreenToggle) {
      onFullscreenToggle();
    } else {
      setInternalFullscreen(prev => !prev);
    }
  }, [onFullscreenToggle]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isTableFullscreen) {
        handleFullscreenToggle();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isTableFullscreen, handleFullscreenToggle]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    exportData: (format) => {
      handleExport(format, tableData, title);
    },
    printTable: () => {
      handlePrint(tableData, title);
    },
    refreshData: async () => {
      const analysisData = await getAnalysisData(null, null, []);
      const transformedData = analysisData.map(row => ({
        ...row,
        approval: row.approval === 'Not' ? 'Pending' : row.approval
      }));
      setTableData(transformedData);
      return transformedData;
    },
    getTableData: () => tableData
  }), [tableData, title]);

  // Handle approval status change
  const handleApprovalChange = useCallback((id, newApproval) => {
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        let newStatus = 'Pending';
        let newRemark = row.remark;
        
        if (newApproval === 'Approved') {
          newStatus = 'Approved';
          newRemark = '';
        } else if (newApproval === 'Ignored') {
          newStatus = 'Ignored';
        }
        
        return { ...row, approval: newApproval, status: newStatus, remark: newRemark };
      }
      return row;
    }));
  }, []);

  // Handle remark editing
  const handleRemarkEdit = useCallback((id, currentRemark) => {
    setEditingRemark(id);
    setRemarkValue(currentRemark || '');
  }, []);

  const handleRemarkSave = useCallback((id) => {
    setTableData(prev => prev.map(row => 
      row.id === id ? { ...row, remark: remarkValue } : row
    ));
    setEditingRemark(null);
    setRemarkValue('');
  }, [remarkValue]);

  const handleRemarkCancel = useCallback(() => {
    setEditingRemark(null);
    setRemarkValue('');
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const approved = tableData.filter(row => row.approval === 'Approved').length;
    const ignored = tableData.filter(row => row.approval === 'Ignored').length;
    const pending = tableData.filter(row => row.approval === 'Pending' || row.approval === 'Not' || !row.approval).length;
    const total = tableData.length;
    
    return { approved, ignored, pending, total };
  }, [tableData]);

  // Render fullscreen mode
  if (isTableFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        <div className="h-full flex flex-col">
          {/* Fullscreen Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 size={24} className="mr-3 text-indigo-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {title} - Fullscreen View
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {subtitle} ({stats.total} issues found)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Statistics in fullscreen */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.total}</div>
                    <div className="text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">{stats.approved}</div>
                    <div className="text-gray-500">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-red-600">{stats.ignored}</div>
                    <div className="text-gray-500">Ignored</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-yellow-600">{stats.pending}</div>
                    <div className="text-gray-500">Pending</div>
                  </div>
                </div>
                <button
                  onClick={handleFullscreenToggle}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Minimize2 size={16} className="mr-2" />
                  Exit Fullscreen
                </button>
              </div>
            </div>
          </div>
          
          {/* Fullscreen Table Content with proper container */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-full overflow-auto">
                <SimpleTable 
                  tableData={tableData}
                  editingRemark={editingRemark}
                  remarkValue={remarkValue}
                  setRemarkValue={setRemarkValue}
                  handleApprovalChange={handleApprovalChange}
                  handleRemarkEdit={handleRemarkEdit}
                  handleRemarkSave={handleRemarkSave}
                  handleRemarkCancel={handleRemarkCancel}
                  isFullscreen={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <BarChart3 size={20} className="mr-2" />
            {title}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <AlertTriangle size={20} className="mr-2 text-red-500" />
            Analysis Error
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal table view
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Table Header with Fullscreen Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 size={20} className="mr-2 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle} ({stats.total} issues found)
              </p>
            </div>
          </div>
          
          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreenToggle}
            className="flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
            title="View in fullscreen (ESC to exit)"
          >
            <Maximize2 size={16} className="mr-2" />
            Fullscreen
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <SimpleTable 
          tableData={tableData}
          editingRemark={editingRemark}
          remarkValue={remarkValue}
          setRemarkValue={setRemarkValue}
          handleApprovalChange={handleApprovalChange}
          handleRemarkEdit={handleRemarkEdit}
          handleRemarkSave={handleRemarkSave}
          handleRemarkCancel={handleRemarkCancel}
          isFullscreen={false}
        />
      </div>
    </div>
  );
});

// Simple HTML Table Component - NO EVENT INTERFERENCE
const SimpleTable = ({ 
  tableData, 
  editingRemark, 
  remarkValue, 
  setRemarkValue,
  handleApprovalChange,
  handleRemarkEdit,
  handleRemarkSave,
  handleRemarkCancel,
  isFullscreen
}) => {
  return (
    <div className={`${isFullscreen ? 'h-full' : ''} overflow-auto`}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              P&ID Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              Issue Found
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              Action Required
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              Approval
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              Remark
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {tableData.map((row, index) => (
            <tr key={row.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
              {/* Serial No */}
              <td className="px-4 py-4 whitespace-nowrap text-center font-semibold">
                {index + 1}
              </td>
              {/* P&ID Number */}
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                  {row.pidNumber}
                </div>
              </td>

              {/* Issue Found */}
              <td className="px-4 py-4">
                <div className={`text-sm text-gray-900 dark:text-gray-100 leading-relaxed ${isFullscreen ? 'max-w-lg' : 'max-w-md'}`}>
                  {row.issueFound}
                </div>
              </td>

              {/* Action Required */}
              <td className="px-4 py-4">
                <div className={`text-sm text-gray-900 dark:text-gray-100 leading-relaxed ${isFullscreen ? 'max-w-lg' : 'max-w-md'}`}>
                  {row.actionRequired}
                </div>
              </td>

              {/* Approval Buttons */}
              <td className="px-4 py-4 text-center">
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleApprovalChange(row.id, 'Approved')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      row.approval === 'Approved' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    <Check size={12} className="inline mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprovalChange(row.id, 'Ignored')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      row.approval === 'Ignored' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    <X size={12} className="inline mr-1" />
                    Ignore
                  </button>
                </div>
              </td>

              {/* Remark */}
              <td className="px-4 py-4">
                {row.approval === 'Approved' ? (
                  <div className="text-center py-4">
                    <span className="text-green-600 text-xs">✓ Approved</span>
                  </div>
                ) : editingRemark === row.id ? (
                  <div className={`space-y-2 ${isFullscreen ? 'max-w-md' : 'max-w-sm'}`}>
                    {/* SIMPLE TEXTAREA - NO EVENT INTERFERENCE */}
                    <textarea
                      value={remarkValue}
                      onChange={(e) => setRemarkValue(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Enter remark (max 500 characters)..."
                      autoFocus
                      rows={3}
                      maxLength={500}
                      onKeyDown={(e) => {
                        // Only handle specific shortcuts - let everything else work normally
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          handleRemarkSave(row.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleRemarkCancel();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{remarkValue.length}/500</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRemarkSave(row.id)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleRemarkCancel}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`w-full cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors min-h-[40px] flex items-center ${isFullscreen ? 'max-w-md' : 'max-w-sm'}`}
                    onClick={() => handleRemarkEdit(row.id, row.remark)}
                  >
                    {row.remark ? (
                      <div className="text-sm">{row.remark}</div>
                    ) : (
                      <div className="text-sm text-gray-400 italic flex items-center">
                        <Edit3 size={12} className="mr-1" />
                        Click to add remark...
                      </div>
                    )}
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-4 text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  row.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  row.status === 'Ignored' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {row.status === 'Approved' ? <CheckCircle size={12} className="mr-1" /> :
                   row.status === 'Ignored' ? <X size={12} className="mr-1" /> :
                   <Clock size={12} className="mr-1" />}
                  {row.status}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

DocumentDataTable.displayName = 'DocumentDataTable';

export default React.memo(DocumentDataTable);