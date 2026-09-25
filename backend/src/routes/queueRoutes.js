import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createQueue,
  getQueueStatus,
  cancelQueue,
  callNext,
  serveQueue,
  completeQueue,
  skipQueue,
  staffCancelQueue,
  recallQueue,
  getOfficeQueueState,
  getPublicDisplayState,
} from '../controllers/queueController.js';

const router = Router();

// Public / client endpoints
router.post('/', createQueue);                    // client: get a queue number
router.get('/display', getPublicDisplayState);     // public display: all offices
router.get('/:id', getQueueStatus);                // client: check own ticket
router.post('/:id/cancel', cancelQueue);           // client: cancel own ticket

// Staff endpoints (JWT required)
router.get('/staff/state', authenticate, getOfficeQueueState);
router.post('/staff/call-next', authenticate, callNext);
router.post('/staff/:id/serve', authenticate, serveQueue);
router.post('/staff/:id/complete', authenticate, completeQueue);
router.post('/staff/:id/skip', authenticate, skipQueue);
router.post('/staff/:id/recall', authenticate, recallQueue);
router.post('/staff/:id/cancel', authenticate, staffCancelQueue);

export default router;
