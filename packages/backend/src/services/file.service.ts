import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { promisify } from 'util';

export class FileService {
  /**
   * Parse uploaded file and extract text content
   */
  async parseFile(buffer: Buffer, mimeType: string, originalFileName: string): Promise<string> {
    const extension = originalFileName.split('.').pop()?.toLowerCase() || '';

    try {
      switch (true) {
        case mimeType.includes('pdf'):
        case extension === 'pdf':
          return await this.extractPdfText(buffer);

        case mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml'):
        case extension === 'docx':
          return await this.extractDocxText(buffer);

        case mimeType.includes('excel') || mimeType.includes('spreadsheet'):
        case extension === 'xlsx' || extension === 'xls':
          return await this.extractExcelText(buffer);

        case mimeType.includes('powerpoint'):
        case extension === 'pptx' || extension === 'ppt':
          return await this.extractPptText(buffer);

        case mimeType.includes('text') || mimeType === 'application/x-yaml':
        case extension === 'txt' || extension === 'md' || extension === 'csv':
          return await this.extractTextContent(buffer);

        default:
          // Try text extraction as fallback
          return await this.extractTextContent(buffer);
      }
    } catch (error: any) {
      console.error(`Error parsing file with ${extension}:`, error);
      // Fallback: try to extract as plain text
      try {
        return await this.extractTextContent(buffer);
      } catch (fallbackError) {
        throw new Error(`Failed to extract content from file: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text || '';
      
      if (!text || text.trim().length === 0) {
        console.warn('⚠️  PDF extracted but contains no readable text (might be scanned image)');
        return `[PDF Document - ${pdfData.numpages || '?'} pages]\n\nNote: This PDF appears to be a scanned image or contains no extractable text. Please copy-paste content manually or upload a text-based PDF.`;
      }
      
      return text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error: any) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Excel
   */
  private async extractExcelText(buffer: Buffer): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let allText = '';

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        allText += `\n--- Sheet: ${sheetName} ---\n${csvText}`;
      }

      return allText;
    } catch (error: any) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PowerPoint (basic - reads XML)
   */
  private async extractPptText(buffer: Buffer): Promise<string> {
    try {
      // For PPTX, we'd need to unzip and parse XML
      // For now, return a message indicating unsupported format
      return '[PowerPoint file detected - text extraction not fully supported. Please manually copy-paste content.]';
    } catch (error: any) {
      throw new Error(`PowerPoint parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractTextContent(buffer: Buffer): Promise<string> {
    try {
      return buffer.toString('utf-8');
    } catch (error: any) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
  }): { valid: boolean; error?: string } {
    // Check file size (50 MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 50MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    // Check file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/x-yaml',
    ];

    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'md',
      'csv',
      'yaml',
      'yml',
    ];

    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    const isExtAllowed = allowedExtensions.includes(extension);

    if (!isMimeAllowed && !isExtAllowed) {
      return {
        valid: false,
        error: `File type not supported. Supported formats: PDF, Word, Excel, PowerPoint, Text, Markdown`,
      };
    }

    return { valid: true };
  }
}

export default new FileService();
