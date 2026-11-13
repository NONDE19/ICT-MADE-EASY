import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createTeacherExercise,
  getPupilDetailForTeacher,
  getTeacherDashboard,
} from '../controllers/teacherController.js';

const router = Router();

router.use(requireAuth, requireRole('TEACHER', 'ADMIN'));

router.get('/dashboard', getTeacherDashboard);
router.get('/pupils/:pupilId', getPupilDetailForTeacher);
router.post('/exercises', createTeacherExercise);

export default router;
