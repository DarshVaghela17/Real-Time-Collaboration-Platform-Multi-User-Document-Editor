import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import commentRoutes from './comment.routes';
import versionRoutes from './version.routes';
import sharingRoutes from './sharing.routes';
import searchRoutes from './search.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/documents', searchRoutes); // Search routes on /documents prefix
router.use('/', commentRoutes); // Comments use /documents/:id/comments
router.use('/', versionRoutes);
router.use('/', sharingRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;