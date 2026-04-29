import { Router } from 'express';
import sharingController from '../controllers/sharing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOwnership } from '../middleware/access.middleware';

const router = Router();

router.use(authenticate);

/**
 * Document sharing routes
 */
router.post(
  '/documents/:documentId/share',
  requireOwnership,
  sharingController.shareDocument.bind(sharingController)
);

router.delete(
  '/documents/:documentId/share/:userId',
  requireOwnership,
  sharingController.unshareDocument.bind(sharingController)
);

router.get(
  '/documents/:documentId/shared-users',
  requireOwnership,
  sharingController.getSharedUsers.bind(sharingController)
);

router.get(
  '/documents/accessible',
  sharingController.getAccessibleDocuments.bind(sharingController)
);

export default router;