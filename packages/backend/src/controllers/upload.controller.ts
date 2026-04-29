import { Response } from 'express';
import { AuthRequest } from '../types';
import documentService from '../services/document.service';
import fileService from '../services/file.service';
import DocumentModel from '../models/Document';
import fs from 'fs/promises';

export class UploadController {
  /**
   * POST /api/documents/upload
   * Upload a file and create a document from it
   */
  async uploadDocument(req: AuthRequest, res: Response): Promise<void> {
    let uploadedFilePath: string | null = null;

    try {
      // Validate file exists
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      uploadedFilePath = req.file.path;

      // Validate file
      const validation = fileService.validateFile({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error,
        });
        return;
      }

      // Read file buffer
      const fileBuffer = await fs.readFile(req.file.path);

      // Extract content from file
      const extractedContent = await fileService.parseFile(
        fileBuffer,
        req.file.mimetype,
        req.file.originalname
      );

      console.log(`✅ Extracted content from ${req.file.originalname}: ${extractedContent.length} bytes`);
      if (!extractedContent || extractedContent.length === 0) {
        console.warn('⚠️  Warning: Extracted content is empty!');
      }

      // Get document title from request or use filename
      const title = req.body.title || req.file.originalname.split('.')[0];

      // Get file type
      const fileType = req.file.originalname.split('.').pop()?.toLowerCase() || 'unknown';

      // Create document with extracted content
      const document = await documentService.createFromUpload(
        req.user!.userId,
        title,
        extractedContent,
        req.file.originalname,
        fileType
      );

      res.status(201).json({
        success: true,
        message: 'Document created from upload successfully',
        data: { document },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process upload',
      });
    } finally {
      // Clean up temporary file
      if (uploadedFilePath) {
        try {
          await fs.unlink(uploadedFilePath);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
      }
    }
  }

  /**
   * GET /api/documents/:id/file-metadata
   * Get file metadata for a document
   */
  async getFileMetadata(req: AuthRequest, res: Response): Promise<void> {
    try {
      const document = await DocumentModel.findById(req.params.id);

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      if (!document.isFromUpload) {
        res.status(400).json({
          success: false,
          message: 'Document was not created from file upload',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          originalFileName: document.originalFileName,
          fileType: document.fileType,
          uploadedAt: document.uploadedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new UploadController();
