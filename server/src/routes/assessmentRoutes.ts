import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMyAttemptHistory,
  listPracticalExercises,
  submitPracticalAttempt,
} from '../controllers/assessmentController.js';

const router = Router();

router.use(requireAuth);

router.get('/exercises', listPracticalExercises);
router.post('/submit', submitPracticalAttempt);
router.get('/history', getMyAttemptHistory);

export default router;
