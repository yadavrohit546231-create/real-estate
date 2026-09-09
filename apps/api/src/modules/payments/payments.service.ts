import { prisma } from '../../config/database';
import { PaymentPurpose, PaymentStatus, NotificationType } from '@real-estate/types';
import { ENV } from '../../config/env';
import crypto from 'crypto';

export class PaymentsService {
  async createOrder(userId: string, data: {
    amount: number;
    currency?: string;
    purpose: PaymentPurpose;
    referenceId: string;
  }) {
    const currency = data.currency || 'INR';
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: data.amount,
        currency,
        purpose: data.purpose,
        referenceId: data.referenceId,
        gatewayOrderId: mockOrderId,
        status: PaymentStatus.CREATED,
      },
    });

    return {
      orderId: mockOrderId,
      amount: data.amount,
      currency,
      keyId: ENV.RAZORPAY_KEY_ID || 'rzp_mock_key',
      paymentRecordId: payment.id,
      mockMode: ENV.MOCK_PAYMENTS_ENABLED,
    };
  }

  async verifyPayment(userId: string, data: {
    orderId: string;
    paymentId: string;
    signature?: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { gatewayOrderId: data.orderId },
    });

    if (!payment) throw new Error('Payment order record not found');
    if (payment.userId !== userId) throw new Error('Unauthorized payment verification');

    // If real Razorpay keys are configured and mock mode is false, verify HMAC SHA256 signature
    if (!ENV.MOCK_PAYMENTS_ENABLED && ENV.RAZORPAY_KEY_SECRET) {
      if (!data.signature) throw new Error('Signature is required for payment verification');
      const text = `${data.orderId}|${data.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (expectedSignature !== data.signature) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, gatewayPaymentId: data.paymentId },
        });
        throw new Error('Payment signature verification failed');
      }
    }

    // Process transaction safely
    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          gatewayPaymentId: data.paymentId,
        },
      });

      // Apply effects based on purpose
      if (payment.purpose === PaymentPurpose.FEATURED_PROPERTY) {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await tx.property.update({
          where: { id: payment.referenceId },
          data: {
            isFeatured: true,
            featuredFrom: now,
            featuredUntil: thirtyDaysLater,
          },
        });

        await tx.notification.create({
          data: {
            userId,
            title: 'Featured Listing Activated!',
            message: 'Your property has been upgraded to Featured for 30 days.',
            type: NotificationType.PAYMENT_SUCCESS,
            entityType: 'Property',
            entityId: payment.referenceId,
          },
        });
      }

      return updatedPayment;
    });
  }

  async getPaymentsForUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const paymentsService = new PaymentsService();
