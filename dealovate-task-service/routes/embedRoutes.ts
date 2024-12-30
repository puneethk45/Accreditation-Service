import express, { Router } from 'express';
import { embedLink, saveUserData, checkStatus } from '../controllers/embedController';

const router: Router = express.Router();

router.post('/api/embed-ui-link', embedLink);
router.post('/api/save-user-data', saveUserData);
router.get('/api/check-status/:serviceId', checkStatus);

export default router;