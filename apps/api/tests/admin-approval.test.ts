import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 'buyer-test-id-123') {
          return Promise.resolve({ id: 'buyer-test-id-123', email: 'buyer@example.com', role: 'BUYER', status: 'ACTIVE', name: 'Buyer' });
        }
        if (where.id === 'owner-test-id-456') {
          return Promise.resolve({ id: 'owner-test-id-456', email: 'owner@example.com', role: 'OWNER', status: 'ACTIVE', name: 'Owner' });
        }
        if (where.id === 'superadmin-test-id-789') {
          return Promise.resolve({ id: 'superadmin-test-id-789', email: 'superadmin@example.com', role: 'SUPER_ADMIN', status: 'ACTIVE', name: 'Platform Manager' });
        }
        if (where.id === 'admin-test-id-999') {
          return Promise.resolve({ id: 'admin-test-id-999', email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE', name: 'Legacy Admin' });
        }
        return Promise.resolve(null);
      }),
    },
    property: {
      findUnique: vi.fn().mockResolvedValue({ id: 'dummy-prop-id', title: 'Sample', ownerId: 'owner-test-id-456' }),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      return callback({
        property: {
          findUnique: vi.fn().mockResolvedValue({ id: 'dummy-prop-id', title: 'Sample', ownerId: 'owner-test-id-456' }),
          update: vi.fn().mockResolvedValue({ id: 'dummy-prop-id', status: 'REJECTED' }),
        },
        propertyApproval: {
          create: vi.fn().mockResolvedValue({ id: 'appr-1' }),
        },
        notification: {
          create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
        },
        adminAction: {
          create: vi.fn().mockResolvedValue({ id: 'act-1' }),
        },
      });
    }),
  },
}));

import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { UserRole } from '@real-estate/types';

describe('Platform Manager (Super Admin) Approval Workflow & RBAC Rules', () => {
  const buyerToken = signAccessToken({
    userId: 'buyer-test-id-123',
    email: 'buyer@example.com',
    role: UserRole.BUYER,
  });

  const ownerToken = signAccessToken({
    userId: 'owner-test-id-456',
    email: 'owner@example.com',
    role: UserRole.OWNER,
  });

  const legacyAdminToken = signAccessToken({
    userId: 'admin-test-id-999',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  });

  const superAdminToken = signAccessToken({
    userId: 'superadmin-test-id-789',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
  });

  it('RULE 3: Buyer cannot access admin pending properties queue', async () => {
    const res = await request(app)
      .get('/api/admin/properties/pending')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RULE 3: Owner cannot approve properties', async () => {
    const res = await request(app)
      .post('/api/admin/properties/dummy-prop-id/approve')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RULE 3: Non-superadmin cannot access platform management endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/properties/pending')
      .set('Authorization', `Bearer ${legacyAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RULE 2: Super Admin rejection MUST require a rejection reason of at least 5 characters', async () => {
    const res = await request(app)
      .post('/api/admin/properties/dummy-prop-id/reject')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: '' }); // empty reason

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('reason');
  });
});
