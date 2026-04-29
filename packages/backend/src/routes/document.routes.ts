import { Router } from 'express';
import documentController from '../controllers/document.controller';
import uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { verifyOwnership } from '../middleware/ownership.middleware';
import { uploadMiddleware, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File upload route (must come before other routes to avoid conflicts)
router.post('/upload', uploadMiddleware.single('file'), handleUploadError, uploadController.uploadDocument.bind(uploadController));

// Create document
router.post('/', documentController.create.bind(documentController));

// Get all user documents
router.get('/', documentController.getAll.bind(documentController));

// Get single document (with ownership check)
router.get(
  '/:id',
  verifyOwnership,
  documentController.getOne.bind(documentController)
);

// Get file metadata (with ownership check)
router.get(
  '/:id/file-metadata',
  verifyOwnership,
  uploadController.getFileMetadata.bind(uploadController)
);

// Update document (with ownership check)
router.put(
  '/:id',
  verifyOwnership,
  documentController.update.bind(documentController)
);

// Delete document (with ownership check)
router.delete(
  '/:id',
  verifyOwnership,
  documentController.delete.bind(documentController)
);

export default router;