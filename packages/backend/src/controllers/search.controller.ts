import { Response } from 'express';
import { AuthRequest } from '../types';
import documentSearchService from '../services/document.search.service';

/**
 * Search API Controller
 * Handles document search requests with text indexing
 */
export class DocumentSearchController {
  /**
   * POST /api/documents/search
   * Search documents by title and content
   *
   * Request body:
   * {
   *   "query": "collaboration",
   *   "limit": 20,
   *   "skip": 0
   * }
   */
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, limit = 20, skip = 0 } = req.body;
      const userId = req.user!.userId;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const results = await documentSearchService.searchDocuments(
        query.trim(),
        userId,
        parseInt(limit as string) || 20,
        parseInt(skip as string) || 0
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Search failed',
      });
    }
  }

  /**
   * GET /api/documents/search/suggestions
   * Get search suggestions (auto-complete)
   *
   * Query params:
   * ?query=hello&limit=10
   */
  async getSuggestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query = '', limit = 10 } = req.query;
      const userId = req.user!.userId;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.json({
          success: true,
          data: { suggestions: [] },
        });
        return;
      }

      const suggestions = await documentSearchService.getSearchSuggestions(
        query.trim(),
        userId,
        parseInt(limit as string) || 10
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get suggestions',
      });
    }
  }

  /**
   * GET /api/documents/:id/similar
   * Get documents similar to the specified document
   */
  async getSimilarDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      const userId = req.user!.userId;

      const similar = await documentSearchService.getSimilarDocuments(
        id as string,
        userId,
        parseInt(limit as string) || 5
      );

      res.json({
        success: true,
        data: { documents: similar },
      });
    } catch (error: any) {
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get similar documents',
      });
    }
  }

  /**
   * POST /api/documents/search/advanced
   * Advanced search with filters
   *
   * Request body:
   * {
   *   "query": "collaboration",
   *   "filters": {
   *     "ownerOnly": false,
   *     "createdAfter": "2026-04-01",
   *     "updatedBefore": "2026-04-15"
   *   },
   *   "limit": 20,
   *   "skip": 0
   * }
   */
  async advancedSearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, filters = {}, limit = 20, skip = 0 } = req.body;
      const userId = req.user!.userId;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      // Parse date filters if provided as strings
      const parsedFilters: any = {
        ownerOnly: filters.ownerOnly === true,
      };

      if (filters.createdAfter) {
        parsedFilters.createdAfter = new Date(filters.createdAfter);
      }
      if (filters.createdBefore) {
        parsedFilters.createdBefore = new Date(filters.createdBefore);
      }
      if (filters.updatedAfter) {
        parsedFilters.updatedAfter = new Date(filters.updatedAfter);
      }
      if (filters.updatedBefore) {
        parsedFilters.updatedBefore = new Date(filters.updatedBefore);
      }
      if (filters.minLength) {
        parsedFilters.minLength = parseInt(filters.minLength);
      }
      if (filters.maxLength) {
        parsedFilters.maxLength = parseInt(filters.maxLength);
      }

      const results = await documentSearchService.searchWithFilters(
        query.trim(),
        userId,
        parsedFilters,
        parseInt(limit as string) || 20,
        parseInt(skip as string) || 0
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Advanced search failed',
      });
    }
  }
}

export default new DocumentSearchController();
