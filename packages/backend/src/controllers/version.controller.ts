import { Response } from 'express';
import { AuthRequest } from '../types';
import versionService from '../services/version.service';

export class VersionController {
  /**
   * @route   POST /api/documents/:documentId/versions
   * @desc    Create a new version snapshot
   * @access  Private (editor or owner)
   */
  async createVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;

      const version = await versionService.createVersion(
        documentId,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        message: 'Version created successfully',
        data: { version },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   GET /api/documents/:documentId/versions
   * @desc    Get all versions for a document
   * @access  Private (requires access)
   */
  async getVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;

      const versions = await versionService.getDocumentVersions(documentId);

      res.json({
        success: true,
        data: {
          versions,
          count: versions.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   GET /api/versions/:versionId
   * @desc    Get a specific version
   * @access  Private (requires access to document)
   */
  async getVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;

      const version = await versionService.getVersion(versionId);

      res.json({
        success: true,
        data: { version },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   POST /api/versions/:versionId/restore
   * @desc    Restore a version
   * @access  Private (editor or owner)
   */
  async restoreVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;

      const result = await versionService.restoreVersion(
        versionId,
        req.user!.userId
      );

      res.json({
        success: true,
        message: 'Version restored successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new VersionController();