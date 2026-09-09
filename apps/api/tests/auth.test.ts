import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Authentication & Security API', () => {
  it('should return 400 when registering with invalid email or missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        phone: '123',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when accessing protected route without authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
