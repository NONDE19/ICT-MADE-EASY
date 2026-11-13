import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  assignTeacherToClass,
  createClass,
  createSchool,
  createUser,
  enrollPupilInClass,
  getAdminOverview,
  getAuditLogs,
  getSystemSettings,
  listClasses,
  listSchools,
  listUsers,
  toggleModulePublished,
  updateSchool,
  updateSystemSetting,
  updateUser,
} from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', getAdminOverview);
router.get('/schools', listSchools);
router.post('/schools', createSchool);
router.patch('/schools/:id', updateSchool);

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

router.get('/classes', listClasses);
router.post('/classes', createClass);
router.post('/classes/assign-teacher', assignTeacherToClass);
router.post('/classes/enroll-pupil', enrollPupilInClass);

router.patch('/modules/:id/toggle', toggleModulePublished);

router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);

router.get('/audit-logs', getAuditLogs);

export default router;
