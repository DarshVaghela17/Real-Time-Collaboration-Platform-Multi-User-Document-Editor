import { Response } from 'express';
import { AuthRequest } from '../types';
import documentService from '../services/document.service';

export class DocumentController {
  // POST /api/documents
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, content } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          message: 'Title is required',
        });
        return;
      }

      const document = await documentService.create(
        req.user!.userId,
        title,
        content
      );

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: { document },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/documents
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documents = await documentService.findByOwner(req.user!.userId);

      res.json({
        success: true,
        data: {
          documents,
          count: documents.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/documents/:id
  async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const document = await documentService.findById(req.params.id);

      res.json({
        success: true,
        data: { document },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/documents/:id
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, content, version } = req.body;

      const document = await documentService.update(
        req.params.id,
        title,
        content,
        version // Pass version for optimistic locking
      );

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: { document },
      });
    } catch (error: any) {
      // Handle version mismatch error
      if (error.message.includes('Version mismatch')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/documents/:id
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await documentService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new DocumentController();