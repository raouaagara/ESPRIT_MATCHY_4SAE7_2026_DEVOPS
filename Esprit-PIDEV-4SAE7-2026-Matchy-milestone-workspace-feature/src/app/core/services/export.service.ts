import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], filename: string = 'export'): void {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = '';
    
    // Add headers
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  /**
   * Export data to Excel format (using HTML table method)
   */
  exportToExcel(data: any[], filename: string = 'export'): void {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create HTML table
    let htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    htmlContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    htmlContent += '<body><table border="1">';
    
    // Add headers
    htmlContent += '<thead><tr>';
    headers.forEach(header => {
      htmlContent += `<th style="background-color: #4f6ef7; color: white; font-weight: bold; padding: 8px;">${this.formatHeader(header)}</th>`;
    });
    htmlContent += '</tr></thead>';
    
    // Add data rows
    htmlContent += '<tbody>';
    data.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      htmlContent += `<tr style="background-color: ${bgColor};">`;
      headers.forEach(header => {
        const value = row[header] !== null && row[header] !== undefined ? row[header] : '';
        htmlContent += `<td style="padding: 8px;">${value}</td>`;
      });
      htmlContent += '</tr>';
    });
    htmlContent += '</tbody>';
    
    htmlContent += '</table></body></html>';

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    this.downloadFile(blob, `${filename}.xls`);
  }

  /**
   * Export data to PDF format
   */
  exportToPDF(data: any[], filename: string = 'export'): void {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const headerLabels = headers.map(h => this.formatHeader(h));

    // Prepare table data
    const tableData = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return value !== null && value !== undefined ? String(value) : '';
      })
    );

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(79, 110, 247);
    doc.text('Events Report', 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated on: ${currentDate}`, 14, 22);

    // Add table
    autoTable(doc, {
      head: [headerLabels],
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [79, 110, 247],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { top: 28, left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });

    // Save the PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Format header text (convert camelCase to Title Case)
   */
  private formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Download file helper
   */
  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Format events data for export
   */
  formatEventsForExport(events: any[]): any[] {
    return events.map(event => ({
      'ID': event.id,
      'Title': event.title,
      'Type': event.type,
      'Date': this.formatDate(event.date),
      'Location': event.location,
      'Attendees': event.attendees,
      'Max Attendees': event.maxAttendees,
      'Status': event.status,
      'Attendance Rate': `${Math.round((event.attendees / event.maxAttendees) * 100)}%`
    }));
  }

  /**
   * Format date for export
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
