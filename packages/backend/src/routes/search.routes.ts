import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import searchController from '../controllers/search.controller';

const router = Router();

/**
 * Search Routes
 * All routes require authentication
 */

// Basic search
router.post('/search', authenticate, (req, res) => searchController.search(req, res));

// Advanced search with filters
router.post('/search/advanced', authenticate, (req, res) => searchController.advancedSearch(req, res));

// Get search suggestions (auto-complete)
router.get('/search/suggestions', authenticate, (req, res) => searchController.getSuggestions(req, res));

// Get similar documents
router.get('/:id/similar', authenticate, (req, res) => searchController.getSimilarDocuments(req, res));

export default router;
