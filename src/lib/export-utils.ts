import ExcelJS from 'exceljs';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  includeTimestamp?: boolean;
  summaryData?: Record<string, any>;
}

export class ExportService {
  /**
   * Generate CSV from data array
   */
  static generateCSV(data: any[], columns: ExportColumn[]): string {
    if (data.length === 0) {
      return 'No data available';
    }

    const headers = columns.map(col => col.header);
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = columns.map(col => {
        let value = row[col.key];
        
        // Handle different data types
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        } else if (col.type === 'currency' && typeof value === 'number') {
          value = value.toFixed(2);
        } else if (col.type === 'percentage' && typeof value === 'number') {
          value = value.toFixed(2);
        }
        
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Generate Excel file from data array
   */
  static async generateExcel(
    data: any[], 
    columns: ExportColumn[], 
    options: ExportOptions
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (data.length === 0) {
      const worksheet = workbook.addWorksheet(options.sheetName || 'Report');
      worksheet.addRow(['No data available']);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    // Create main data worksheet
    const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Add title if filename provided
    if (options.filename) {
      const titleRow = worksheet.addRow([options.filename]);
      titleRow.font = { bold: true, size: 16 };
      worksheet.addRow([]); // Empty row
    }

    // Add timestamp if requested
    if (options.includeTimestamp) {
      const timestampRow = worksheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
      timestampRow.font = { italic: true };
      worksheet.addRow([]); // Empty row
    }

    // Add headers
    const headers = columns.map(col => col.header);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach((row) => {
      const values = columns.map(col => {
        let value = row[col.key];
        
        // Handle boolean values
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        
        return value;
      });
      worksheet.addRow(values);
    });

    // Set column widths and formats
    columns.forEach((col, index) => {
      const column = worksheet.getColumn(index + 1);
      
      if (col.width) {
        column.width = col.width;
      }
      
      // Apply number formatting based on type
      switch (col.type) {
        case 'currency':
          column.numFmt = '$#,##0.00';
          break;
        case 'percentage':
          column.numFmt = '0.00%';
          break;
        case 'date':
          column.numFmt = 'mm/dd/yyyy';
          break;
        case 'number':
          column.numFmt = '#,##0.00';
          break;
      }
    });

    // Add borders to all data cells
    const dataStartRow = options.filename || options.includeTimestamp ? 4 : 1;
    const dataEndRow = dataStartRow + data.length;
    
    for (let rowIndex = dataStartRow; rowIndex <= dataEndRow; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Add summary sheet if summary data provided
    if (options.summaryData) {
      const summaryWorksheet = workbook.addWorksheet('Summary');
      
      summaryWorksheet.addRow(['Report Summary']);
      summaryWorksheet.addRow([]);
      summaryWorksheet.addRow(['Metric', 'Value']);
      
      Object.entries(options.summaryData).forEach(([key, value]) => {
        summaryWorksheet.addRow([key, value]);
      });

      // Format summary sheet
      summaryWorksheet.getColumn(1).width = 25;
      summaryWorksheet.getColumn(2).width = 20;
      
      const summaryTitleRow = summaryWorksheet.getRow(1);
      summaryTitleRow.font = { bold: true, size: 14 };
      
      const summaryHeaderRow = summaryWorksheet.getRow(3);
      summaryHeaderRow.font = { bold: true };
      summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Create download response for browser
   */
  static createDownloadResponse(
    data: Buffer | string, 
    filename: string, 
    format: 'csv' | 'excel'
  ): Response {
    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const fullFilename = filename.endsWith(`.${extension}`) 
      ? filename 
      : `${filename}.${extension}`;

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fullFilename}"`,
      },
    });
  }

  /**
   * Validate export parameters
   */
  static validateExportParams(params: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): { isValid: boolean; error?: string } {
    if (params.format && !['csv', 'excel'].includes(params.format)) {
      return { isValid: false, error: 'Invalid format. Must be csv or excel.' };
    }

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      
      if (start > end) {
        return { isValid: false, error: 'Start date must be before end date.' };
      }
      
      // Check if date range is too large (more than 1 year)
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > oneYear) {
        return { isValid: false, error: 'Date range cannot exceed 1 year.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(baseName: string, startDate?: string, endDate?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (startDate && endDate) {
      return `${baseName}-${startDate}-to-${endDate}`;
    }
    
    return `${baseName}-${timestamp}`;
  }
}