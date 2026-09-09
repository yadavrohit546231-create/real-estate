import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/database', () => ({
  prisma: {
    property: {
      count: vi.fn().mockResolvedValue(5),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'prop-1',
          title: 'Luxury 3 BHK High-Rise Apartment',
          description: 'Stunning 3 BHK apartment with panoramic view',
          listingType: 'SALE',
          category: 'RESIDENTIAL',
          propertyType: 'APARTMENT',
          price: 13500000,
          area: 1850,
          areaUnit: 'SQ_FT',
          locality: 'Bailey Road',
          city: 'Patna',
          status: 'LIVE',
          isVerified: true,
          isFeatured: true,
          images: [],
          amenities: [],
          owner: { id: 'owner-1', name: 'Rajesh', phone: '+91 9822200001' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
  },
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Public Properties & Search API', () => {
  it('RULE 5: Unauthenticated users can search properties without logging in', async () => {
    const res = await request(app).get('/api/properties?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });

  it('Property filters accept valid query parameters', async () => {
    const res = await request(app).get('/api/properties?city=Patna&category=RESIDENTIAL&minPrice=100000');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('RULE 6: Posting a property requires authentication', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({
        title: 'Unauthorized Luxury Penthouse',
        description: 'Trying to post without auth token',
        listingType: 'SALE',
        category: 'RESIDENTIAL',
        propertyType: 'APARTMENT',
        price: 5000000,
        area: 1200,
        locality: 'Bailey Road',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800001',
      });

    expect(res.status).toBe(401);
  });
});
