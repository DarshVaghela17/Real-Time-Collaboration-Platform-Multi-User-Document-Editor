import { Router } from 'express';
import versionController from '../controllers/version.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireDocumentAccess,
  requireEditPermission,
} from '../middleware/access.middleware';

const router = Router();

router.use(authenticate);

/**
 * Version routes for a document
 */
router.post(
  '/documents/:documentId/versions',
  requireDocumentAccess,
  requireEditPermission,
  versionController.createVersion.bind(versionController)
);

router.get(
  '/documents/:documentId/versions',
  requireDocumentAccess,
  versionController.getVersions.bind(versionController)
);

router.get(
  '/versions/:versionId',
  versionController.getVersion.bind(versionController)
);

router.post(
  '/versions/:versionId/restore',
  requireEditPermission,
  versionController.restoreVersion.bind(versionController)
);

export default router;