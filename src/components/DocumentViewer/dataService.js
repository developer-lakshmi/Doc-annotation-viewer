// import { analyzeDocument } from '../../../../services/api';
import { analyzeDocument } from '../../../../services/api';

/**
 * Parse HTML table data from API response
 * @param {string} htmlString - HTML table string
 * @returns {Array} Parsed table data
 */
export const parseHtmlTableData = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  
  return Array.from(rows).map((row, index) => {
    const cells = row.querySelectorAll('td');
    return {
      id: index + 1,
      pidNumber: cells[0]?.textContent?.trim() || '',
      issueFound: cells[1]?.textContent?.trim() || '',
      actionRequired: cells[2]?.textContent?.trim() || '',
      approval: 'Pending', // Default approval status
      remark: '', // Default empty remark
      status: 'Pending' // Default status
    };
  });
};

/**
 * Get analysis data ONLY from real API.
 * @param {string} fileId - File ID for analysis
 * @param {string} projectId - Project ID
 * @param {Array} providedData - Data provided via props
 * @returns {Promise<Array>} Table data
 */
export const getAnalysisData = async (fileId = null, projectId = null, providedData = []) => {
  try {
    // If real data is provided via props, use it
    if (providedData && providedData.length > 0) {
      if (typeof providedData[0] === 'string') {
        return parseHtmlTableData(providedData[0]);
      }
      return providedData;
    }

    // Always use real API, never mock
    if (!fileId || !projectId) {
      throw new Error('File ID and Project ID are required for analysis');
    }

    console.log('Fetching data from external analysis API...');
    const response = await analyzeDocument(fileId, projectId);

    // Log the response for debugging
    console.log('API response:', response);

    if (
      response &&
      (response.success === true || response.success === "True") &&
      response.data &&
      response.data.result
    ) {
      // Parse HTML response from API
      return parseHtmlTableData(response.data.result);
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    // Log error and rethrow so UI shows error
    console.error('External API call failed:', error.message);
    throw error;
  }
};

/**
 * Initialize analysis - can be called when component mounts or when file changes
 * @param {string} fileId - File ID for analysis
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Table data
 */
export const initializeAnalysis = async (fileId, projectId) => {
  return await getAnalysisData(fileId, projectId);
};