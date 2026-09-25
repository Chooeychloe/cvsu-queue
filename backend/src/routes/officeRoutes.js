import { Router } from 'express';
import { listOffices, listWindows } from '../controllers/officeController.js';

const router = Router();

router.get('/', listOffices);
router.get('/:officeId/windows', listWindows);

export default router;
