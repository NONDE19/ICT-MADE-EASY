import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createFile,
  createFolder,
  emptyRecycleBin,
  getDesktopState,
  updateDesktopSettings,
  updateFile,
  updateFolder,
} from '../controllers/desktopController.js';

const router = Router();

router.use(requireAuth);

router.get('/state', getDesktopState);
router.patch('/settings', updateDesktopSettings);
router.post('/folders', createFolder);
router.patch('/folders/:id', updateFolder);
router.post('/files', createFile);
router.patch('/files/:id', updateFile);
router.delete('/recycle-bin', emptyRecycleBin);

export default router;
