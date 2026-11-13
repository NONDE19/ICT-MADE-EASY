import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getModuleBySlug,
  getOfflineBundle,
  getPupilDashboard,
  listModules,
  markNotificationRead,
  submitQuiz,
  updateLearningProgress,
} from '../controllers/learningController.js';

const router = Router();

router.use(requireAuth);

router.get('/pupil-dashboard', getPupilDashboard);
router.get('/modules', listModules);
router.get('/modules/:slug', getModuleBySlug);
router.post('/progress', updateLearningProgress);
router.post('/quiz/submit', submitQuiz);
router.get('/offline-bundle', getOfflineBundle);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
