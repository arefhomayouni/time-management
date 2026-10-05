import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Time Management API',
      version: '1.0.0',
      description: '🚀 A professional API for personal and group time management, earnings tracking, and payment oversight.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
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
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '650c1234567890abcdef1234' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            personalRate: { type: 'number', example: 25 },
            role: { type: 'string', enum: ['user', 'manager'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '650c9876543210fedcba4321' },
            name: { type: 'string', example: 'Project Alpha' },
            hourlyRate: { type: 'number', example: 50 },
            manager: { type: 'string', example: '650c1234567890abcdef1234' },
            members: {
              type: 'array',
              items: { type: 'string' },
              example: ['650c1234567890abcdef1234', '650c9876543210fedcba4321']
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TimeLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '650c11112222333344445555' },
            user: { type: 'string', example: '650c1234567890abcdef1234' },
            group: { type: 'string', nullable: true, example: '650c9876543210fedcba4321' },
            date: { type: 'string', format: 'date', example: '2026-10-05' },
            hours: { type: 'number', example: 8 },
            amount: { type: 'number', example: 400 },
            status: { type: 'string', enum: ['pending', 'paid'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '650c99998888777766665555' },
            user: { type: 'string', example: '650c1234567890abcdef1234' },
            group: { type: 'string', nullable: true, example: '650c9876543210fedcba4321' },
            amount: { type: 'number', example: 1600 },
            date: { type: 'string', format: 'date-time' },
            paymentMethod: { type: 'string', example: 'transfer' },
            notes: { type: 'string', example: 'Payment for October' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid input data' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const specs = swaggerJsdoc(options);
