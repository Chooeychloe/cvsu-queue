import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  listOfficesAdmin,
  createOffice,
  updateOffice,
  addWindow,
  setWindowStatus,
  deleteWindow,
  listStaff,
  createStaff,
  updateStaff,
  resetStaffPassword,
} from '../controllers/adminController.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/offices', listOfficesAdmin);
router.post('/offices', createOffice);
router.patch('/offices/:id', updateOffice);

router.post('/offices/:officeId/windows', addWindow);
router.patch('/windows/:id/status', setWindowStatus);
router.delete('/windows/:id', deleteWindow);

router.get('/staff', listStaff);
router.post('/staff', createStaff);
router.patch('/staff/:id', updateStaff);
router.post('/staff/:id/reset-password', resetStaffPassword);

export default router;
