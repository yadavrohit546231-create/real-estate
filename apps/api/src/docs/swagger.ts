export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Real Estate Marketplace API',
    version: '1.0.0',
    description: 'Comprehensive REST API documentation for the Real Estate Marketplace platform (99acres / Housing.com style).',
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Base',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'user@example.com' },
                  phone: { type: 'string', example: '+91 9876543210' },
                  password: { type: 'string', example: 'Secret123!' },
                  role: { type: 'string', enum: ['BUYER', 'OWNER', 'AGENT', 'BUILDER'], example: 'BUYER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful with tokens' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@realestate.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/properties': {
      get: {
        summary: 'List & search properties with extensive filters',
        tags: ['Properties'],
        parameters: [
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'listingType', in: 'query', schema: { type: 'string', enum: ['SALE', 'RENT'] } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL', 'PG'] } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated list of properties' },
        },
      },
      post: {
        summary: 'Post a new property',
        tags: ['Properties'],
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Property created (status: PENDING_REVIEW)' },
        },
      },
    },
    '/admin/properties/pending': {
      get: {
        summary: 'List properties pending admin review',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Pending properties list' },
          403: { description: 'Admin role required' },
        },
      },
    },
    '/admin/properties/{id}/approve': {
      post: {
        summary: 'Approve pending property and make LIVE',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Property approved successfully' },
        },
      },
    },
    '/admin/properties/{id}/reject': {
      post: {
        summary: 'Reject pending property with mandatory reason',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', example: 'Incomplete property address or low resolution photos.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Property rejected with reason stored' },
        },
      },
    },
  },
};
