import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Import autoTable plugin - this adds autoTable method to jsPDF
require('jspdf-autotable');

/**
 * Export utilities for DocumentDataTable
 * Contains all export and print functionality
 */

/**
 * Export table data to Excel format
 * @param {Array} tableData - The table data to export
 * @returns {void}
 */
export const exportToExcel = (tableData) => {
  try {
    const exportData = tableData.map(row => {
      // Transform approval value to show "Pending" instead of "Not"
      const approvalValue = (row.approval === 'Not' || row.approval === 'NO' || row.approval === 'No' || !row.approval || row.approval === '') ? 'Pending' : row.approval;
      
      return {
        'P&ID Number': row.pidNumber,
        'Issue Found': row.issueFound,
        'Action Required': row.actionRequired,
        'Approval': approvalValue,
        'Remark': row.remark || '',
        'Status': row.status
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Apply professional styling to headers
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[headerCell]) continue;
      
      // Header styling - professional blue theme
      ws[headerCell].s = {
        fill: { fgColor: { rgb: "1F4E79" } }, // Professional dark blue
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" }, 
          sz: 12,
          name: "Calibri"
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } }
        }
      };
    }
    
    // Apply styling to data cells
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Get column header to determine cell type
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        const columnName = ws[headerCell] ? ws[headerCell].v : '';
        
        // Base cell styling
        ws[cellAddress].s = {
          font: { 
            name: "Calibri", 
            sz: 11 
          },
          alignment: { 
            vertical: "top",
            wrapText: true 
          },
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
          }
        };
        
        // Special styling for specific columns
        if (columnName === 'Approval') {
          const cellValue = ws[cellAddress].v;
          if (cellValue === 'Approved') {
            ws[cellAddress].s.fill = { fgColor: { rgb: "D4EDDA" } }; // Light green
            ws[cellAddress].s.font.color = { rgb: "155724" }; // Dark green
            ws[cellAddress].s.font.bold = true;
            ws[cellAddress].s.alignment.horizontal = "center";
          } else if (cellValue === 'Ignored') {
            ws[cellAddress].s.fill = { fgColor: { rgb: "F8D7DA" } }; // Light red
            ws[cellAddress].s.font.color = { rgb: "721C24" }; // Dark red
            ws[cellAddress].s.font.bold = true;
            ws[cellAddress].s.alignment.horizontal = "center";
          } else if (cellValue === 'Pending') {
            ws[cellAddress].s.fill = { fgColor: { rgb: "FFF3CD" } }; // Light yellow
            ws[cellAddress].s.font.color = { rgb: "856404" }; // Dark yellow
            ws[cellAddress].s.font.bold = true;
            ws[cellAddress].s.alignment.horizontal = "center";
          }
        } else if (columnName === 'Status') {
          const cellValue = ws[cellAddress].v;
          ws[cellAddress].s.alignment.horizontal = "center";
          ws[cellAddress].s.font.bold = true;
          if (cellValue === 'Approved') {
            ws[cellAddress].s.font.color = { rgb: "155724" };
          } else if (cellValue === 'Ignored') {
            ws[cellAddress].s.font.color = { rgb: "721C24" };
          } else {
            ws[cellAddress].s.font.color = { rgb: "6C757D" };
          }
        } else if (columnName === 'P&ID Number') {
          ws[cellAddress].s.font.bold = true;
          ws[cellAddress].s.alignment.horizontal = "center";
          ws[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" } }; // Light gray background
        }
        
        // Alternate row coloring for better readability
        if (R % 2 === 0) {
          if (!ws[cellAddress].s.fill) {
            ws[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" } }; // Very light gray
          }
        }
      }
    }
    
    // Set professional column widths
    const colWidths = [
      { wch: 18 }, // P&ID Number
      { wch: 55 }, // Issue Found
      { wch: 55 }, // Action Required
      { wch: 15 }, // Approval
      { wch: 45 }, // Remark
      { wch: 15 }  // Status
    ];
    ws['!cols'] = colWidths;
    
    // Set row heights for better readability
    const rowHeights = [];
    for (let i = 0; i <= range.e.r; i++) {
      rowHeights.push({ hpt: i === 0 ? 25 : 20 }); // Header row taller
    }
    ws['!rows'] = rowHeights;

    // Create workbook and add title sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&ID Analysis Results');
    
    // Add metadata
    wb.Props = {
      Title: "P&ID Analysis Results",
      Subject: "Engineering Analysis Report",
      Author: "P&ID Analysis System",
      CreatedDate: new Date()
    };

    const fileName = `PID_Analysis_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Export to Excel failed:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

/**
 * Export table data to CSV format
 * @param {Array} tableData - The table data to export
 * @returns {void}
 */
export const exportToCSV = (tableData) => {
  try {
    const headers = ['P&ID Number', 'Issue Found', 'Action Required', 'Approval', 'Remark', 'Status'];
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => [
        `"${row.pidNumber}"`,
        `"${row.issueFound.replace(/"/g, '""')}"`,
        `"${row.actionRequired.replace(/"/g, '""')}"`,
        `"${row.approval}"`,
        `"${row.remark.replace(/"/g, '""')}"`,
        `"${row.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset-utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `PID_Analysis_Results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export to CSV failed:', error);
    alert('Failed to export to CSV. Please try again.');
  }
};

/**
 * Export table data to PDF format with enhanced styling
 * @param {Array} tableData - The table data to export
 * @param {string} title - The document title
 * @returns {void}
 */
export const exportToPDF = (tableData, title = "P&ID Analysis Results") => {
  try {
    console.log('Starting PDF export...');
    
    // Create PDF in landscape mode for better table fit
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Professional color scheme
    const colors = {
      primary: [31, 78, 121],      // Professional blue
      secondary: [248, 249, 250],   // Light gray
      success: [34, 139, 34],       // Green
      warning: [255, 193, 7],       // Yellow
      danger: [220, 53, 69],        // Red
      text: [33, 37, 41],          // Dark gray
      lightText: [108, 117, 125]    // Medium gray
    };
    
    // Add professional header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('P&ID ANALYSIS RESULTS', 15, 20);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Engineering Review Document', 15, 28);
    
    // Document info box
    doc.setFillColor(...colors.secondary);
    doc.rect(15, 40, doc.internal.pageSize.width - 30, 25, 'F');
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.rect(15, 40, doc.internal.pageSize.width - 30, 25);
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Information:', 20, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 54);
    doc.text(`Total Issues: ${tableData.length}`, 20, 58);
    doc.text(`Report: ${title}`, 20, 62);
    
    // Statistics
    const approvedCount = tableData.filter(row => row.approval === 'Approved').length;
    const ignoredCount = tableData.filter(row => row.approval === 'Ignored').length;
    const pendingCount = tableData.filter(row => row.approval === 'Pending' || row.approval === 'Not' || !row.approval).length;
    
    doc.text(`Approved: ${approvedCount}`, 180, 54);
    doc.text(`Ignored: ${ignoredCount}`, 180, 58);
    doc.text(`Pending: ${pendingCount}`, 180, 62);
    
    // Prepare professional table data
    const tableColumns = [
      { header: 'P&ID Number', dataKey: 'pidNumber' },
      { header: 'Issue Found', dataKey: 'issueFound' },
      { header: 'Action Required', dataKey: 'actionRequired' },
      { header: 'Approval Status', dataKey: 'approval' },
      { header: 'Remark', dataKey: 'remark' },
      { header: 'Status', dataKey: 'status' }
    ];
    
    const tableRows = tableData.map(row => {
      // Transform approval value to show "Pending" instead of "Not"
      const approvalValue = (row.approval === 'Not' || row.approval === 'NO' || row.approval === 'No' || !row.approval || row.approval === '') ? 'Pending' : row.approval;
      
      return {
        pidNumber: row.pidNumber || '',
        issueFound: row.issueFound || '',
        actionRequired: row.actionRequired || '',
        approval: approvalValue,
        remark: row.remark || '',
        status: row.status || ''
      };
    });
    
    // Use autoTable with professional styling
    doc.autoTable({
      columns: tableColumns,
      body: tableRows,
      startY: 75,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'top',
        lineColor: colors.primary,
        lineWidth: 0.1,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10, // Increased font size for headers
        halign: 'center',
        cellPadding: 8, // Increased padding
        minCellHeight: 15 // Increased minimum height
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }, // P&ID Number - increased width further
        1: { cellWidth: 55, halign: 'left' },                      // Issue Found
        2: { cellWidth: 55, halign: 'left' },                      // Action Required
        3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }, // Approval
        4: { cellWidth: 40, halign: 'left' },                      // Remark
        5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }  // Status
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { top: 75, right: 8, bottom: 30, left: 8 }, // Further reduced margins
      tableWidth: 'auto',
      didParseCell: function(data) {
        // Ensure header text is properly displayed with better formatting
        if (data.section === 'head') {
          data.cell.styles.overflow = 'linebreak';
          data.cell.styles.cellPadding = { top: 8, right: 4, bottom: 8, left: 4 };
          data.cell.styles.fontSize = 10;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
          data.cell.styles.fillColor = colors.primary; // Ensure primary background
          data.cell.styles.textColor = [255, 255, 255]; // Ensure white text
          
          // Special handling for P&ID Number column header
          if (data.column.dataKey === 'pidNumber') {
            data.cell.styles.fontSize = 10; // Keep same size as other headers
            data.cell.styles.fillColor = colors.primary; // Ensure primary blue background
            data.cell.styles.textColor = [255, 255, 255]; // Ensure white text
            data.cell.text = ['P&ID Number']; // Ensure text is properly set
          }
        }
        
        // Professional color coding for approval column
        if (data.column.dataKey === 'approval') {
          if (data.cell.text[0] === 'Approved') {
            data.cell.styles.fillColor = [212, 237, 218]; // Professional green
            data.cell.styles.textColor = [21, 87, 36];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Ignored') {
            data.cell.styles.fillColor = [248, 215, 218]; // Professional red
            data.cell.styles.textColor = [114, 28, 36];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Pending') {
            data.cell.styles.fillColor = [255, 243, 205]; // Professional yellow
            data.cell.styles.textColor = [133, 100, 4];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Professional color coding for status column
        if (data.column.dataKey === 'status') {
          if (data.cell.text[0] === 'Approved') {
            data.cell.styles.textColor = [21, 87, 36];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Ignored') {
            data.cell.styles.textColor = [114, 28, 36];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Pending') {
            data.cell.styles.textColor = [133, 100, 4];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Style P&ID Number column DATA cells (not header)
        if (data.column.dataKey === 'pidNumber' && data.section !== 'head') {
          data.cell.styles.fillColor = [248, 249, 250];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: function (data) {
        // Professional footer
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        // Footer line
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
        
        // Page number
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.setFont('helvetica', 'normal');
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - 40, pageHeight - 15);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text('Generated from P&ID Analysis System | Confidential Engineering Document', 15, pageHeight - 15);
        
        // Document classification
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('ENGINEERING REVIEW DOCUMENT', 15, pageHeight - 8);
      }
    });
    
    // Add professional summary box
    const finalY = doc.lastAutoTable.finalY + 15;
    
    if (finalY < doc.internal.pageSize.height - 60) {
      // Summary box
      doc.setFillColor(...colors.secondary);
      doc.rect(15, finalY, doc.internal.pageSize.width - 30, 35, 'F');
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.rect(15, finalY, doc.internal.pageSize.width - 30, 35);
      
      // Summary title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('ANALYSIS SUMMARY', 20, finalY + 10);
      
      // Summary statistics with professional formatting
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      
      // Create summary columns
      const col1X = 20;
      const col2X = 120;
      const col3X = 220;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 87, 36);
      doc.text('✓ APPROVED', col1X, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${approvedCount} items`, col1X, finalY + 26);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(114, 28, 36);
      doc.text('✗ IGNORED', col2X, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${ignoredCount} items`, col2X, finalY + 26);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(133, 100, 4);
      doc.text('⏳ PENDING', col3X, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pendingCount} items`, col3X, finalY + 26);
    }
    
    // Generate professional filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `PID_Analysis_Results_${timestamp}.pdf`;
    
    console.log('Saving PDF...');
    doc.save(fileName);
    console.log('PDF export completed successfully');
    
  } catch (error) {
    console.error('Export to PDF failed:', error);
    alert(`Failed to export to PDF: ${error.message}. Please check console for details.`);
  }
};

/**
 * Print table with enhanced styling that preserves exact colors and formatting
 * @param {Array} tableData - The table data to print
 * @param {string} title - The document title
 * @returns {void}
 */
export const handlePrint = (tableData, title = "P&ID Analysis Results") => {
  try {
    // Generate print content with exact button colors and styling
    const generatePrintContent = () => {
      const printRows = tableData.map(row => {
        const approveButtonStyle = row.approval === 'Approved' 
          ? 'background-color: #4ade80; color: white;' 
          : 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';
        
        const ignoreButtonStyle = row.approval === 'Ignored' 
          ? 'background-color: #f87171; color: white;' 
          : 'background-color: #fecaca; color: #dc2626; border: 1px solid #fca5a5;';

        const statusBadgeStyle = 
          row.status === 'Approved' ? 'background-color: #4ade80; color: white;' :
          row.status === 'Ignored' ? 'background-color: #f87171; color: white;' :
          row.status === 'Pending' ? 'background-color: #9ca3af; color: white;' : 
          'background-color: #3b82f6; color: white;';

        const remarkContent = row.approval === 'Approved' 
          ? '<em style="color: #9ca3af; font-style: italic;">No remark needed</em>'
          : (row.remark || '<em style="color: #9ca3af;">No remark</em>');

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 12px;">
              ${row.pidNumber}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 300px; word-wrap: break-word; line-height: 1.4;">
              ${row.issueFound}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 300px; word-wrap: break-word; line-height: 1.4;">
              ${row.actionRequired}
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; text-align: center; vertical-align: top;">
              <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; ${approveButtonStyle} display: inline-flex; align-items: center;">
                  ✓ Approve
                </span>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; ${ignoreButtonStyle} display: inline-flex; align-items: center;">
                  ✗ Ignore
                </span>
              </div>
            </td>
            <td style="padding: 12px 8px; border-right: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; max-width: 250px; word-wrap: break-word; line-height: 1.4;">
              ${remarkContent}
            </td>
            <td style="padding: 12px 8px; text-align: center; vertical-align: top;">
              <span style="padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; ${statusBadgeStyle}">
                ${row.status}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>P&ID Analysis Results</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0.5in;
              size: A4 landscape;
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1f2937;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .print-header h1 { 
              color: #1f2937; 
              margin: 0 0 10px 0; 
              font-size: 24px; 
              font-weight: 700;
            }
            .print-header .meta {
              color: #6b7280;
              font-size: 12px;
              margin: 5px 0;
            }
            .print-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 0;
              background: white;
              border: 1px solid #d1d5db;
            }
            .print-table th { 
              background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
              border: 1px solid #d1d5db;
              padding: 12px 8px; 
              text-align: center; 
              font-weight: 700;
              font-size: 11px;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .print-table td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              vertical-align: top;
            }
            .print-table tbody tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .print-table tbody tr:hover { 
              background-color: #f3f4f6; 
            }
            @media print {
              body { 
                margin: 0; 
                padding: 10px;
                font-size: 10px;
              }
              .print-header h1 {
                font-size: 18px;
              }
              .print-table { 
                page-break-inside: auto; 
                font-size: 9px;
              }
              .print-table thead {
                display: table-header-group;
              }
              .print-table tbody tr { 
                page-break-inside: avoid; 
                page-break-after: auto; 
              }
              .print-table th {
                background: #f1f5f9 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              span[style*="background-color"] {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>P&ID Analysis Results</h1>
            <div class="meta"><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            <div class="meta"><strong>Total Issues:</strong> ${tableData.length}</div>
            <div class="meta"><strong>Document:</strong> ${title}</div>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 12%;">P&ID Number</th>
                <th style="width: 28%;">Issue Found</th>
                <th style="width: 28%;">Action Required</th>
                <th style="width: 12%;">Approval</th>
                <th style="width: 15%;">Remark</th>
                <th style="width: 8%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${printRows}
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 10px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p>This document contains ${tableData.length} items. Generated from P&ID Analysis System.</p>
          </div>
        </body>
        </html>
      `;
    };

    // Create and open print window
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print.');
      return;
    }

    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Don't close automatically - let user decide
        // printWindow.close();
      }, 250);
    };

  } catch (error) {
    console.error('Print failed:', error);
    alert('Failed to print. Please try again.');
  }
};

/**
 * Main export handler that routes to appropriate export function
 * @param {string} format - Export format: 'excel', 'csv', or 'pdf'
 * @param {Array} tableData - The table data to export
 * @param {string} title - The document title
 * @returns {void}
 */
export const handleExport = (format, tableData, title) => {
  switch (format) {
    case 'excel':
      exportToExcel(tableData);
      break;
    case 'csv':
      exportToCSV(tableData);
      break;
    case 'pdf':
      exportToPDF(tableData, title);
      break;
    default:
      console.error('Unsupported export format:', format);
      alert('Unsupported export format. Please use excel, csv, or pdf.');
  }
};