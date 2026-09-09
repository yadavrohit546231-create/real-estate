import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { CreatePaymentOrderSchema, VerifyPaymentSchema } from '@real-estate/validation';

const router = Router();

router.use(authenticateToken);

router.post('/create-order', validateBody(CreatePaymentOrderSchema), paymentsController.createOrder);
router.post('/verify', validateBody(VerifyPaymentSchema), paymentsController.verifyPayment);
router.get('/', paymentsController.getPayments);

export default router;
