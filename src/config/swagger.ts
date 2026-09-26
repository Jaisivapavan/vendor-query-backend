export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'VendorQuery API',
    version: '1.0.0',
    description:
      'Production-grade Multi-Tenant Restaurant POS & Conversational Sales Intelligence Engine powered by Node.js, TypeScript, PostgreSQL, and Google Gemini AI Tool Calling.',
    contact: {
      name: 'Penumaru Jai Sivapavan Reddy',
      url: 'https://github.com/Jaisivapavan/vendor-query-backend',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Server',
    },
    {
      url: 'https://vendor-query-backend.onrender.com',
      description: 'Production Live Server (Render)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from POST /api/auth/login',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['businessName', 'email', 'password'],
        properties: {
          businessName: { type: 'string', example: 'Spice Craft Bistro' },
          email: { type: 'string', format: 'email', example: 'demo@restaurant.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@restaurant.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Starters' },
        },
      },
      MenuItemInput: {
        type: 'object',
        required: ['categoryId', 'name', 'price'],
        properties: {
          categoryId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
          name: { type: 'string', example: 'Butter Chicken' },
          price: { type: 'number', example: 380 },
        },
      },
      CreateOrderInput: {
        type: 'object',
        required: ['items'],
        properties: {
          paymentMethod: { type: 'string', enum: ['CASH', 'UPI', 'CARD'], default: 'CASH' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['menuItemId', 'quantity'],
              properties: {
                menuItemId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer', example: 2 },
              },
            },
          },
        },
      },
      ChatMessageInput: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            example: 'What were our top 3 selling dishes this month and total revenue?',
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          200: {
            description: 'API is healthy and operational',
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new vendor account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: { 201: { description: 'Vendor registered successfully' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Vendor login to receive JWT token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { 200: { description: 'Login successful with JWT token' } },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get authenticated vendor profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Vendor profile details' } },
      },
    },
    '/api/menu/categories': {
      get: {
        tags: ['Menu & Inventory'],
        summary: 'List food categories for current vendor',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of categories' } },
      },
      post: {
        tags: ['Menu & Inventory'],
        summary: 'Create a new food category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryInput' } } },
        },
        responses: { 201: { description: 'Category created' } },
      },
    },
    '/api/menu/items': {
      get: {
        tags: ['Menu & Inventory'],
        summary: 'Retrieve menu dishes for POS billing',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'available', in: 'query', schema: { type: 'boolean' }, description: 'Filter only available dishes' },
        ],
        responses: { 200: { description: 'List of dishes' } },
      },
      post: {
        tags: ['Menu & Inventory'],
        summary: 'Add a new dish to the menu',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MenuItemInput' } } },
        },
        responses: { 201: { description: 'Menu item created' } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders & POS Billing'],
        summary: 'Create a new transactional order with 5% GST computation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderInput' } } },
        },
        responses: { 201: { description: 'Order created & billed successfully' } },
      },
      get: {
        tags: ['Orders & POS Billing'],
        summary: 'List past orders with pagination & date range filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: { description: 'Paginated order history' } },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders & POS Billing'],
        summary: 'Retrieve detailed view of a single invoice',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Single order invoice details' } },
      },
    },
    '/api/reports/top-items': {
      get: {
        tags: ['Deterministic Analytics'],
        summary: 'Top dishes ranked by quantity sold and revenue',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Top selling dishes aggregation' } },
      },
    },
    '/api/reports/revenue': {
      get: {
        tags: ['Deterministic Analytics'],
        summary: 'Gross revenue, 5% GST tax collected, net sales & AOV',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Revenue summary metrics' } },
      },
    },
    '/api/reports/payment-split': {
      get: {
        tags: ['Deterministic Analytics'],
        summary: 'Sales distribution across UPI, Cash, and Card',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Payment method breakdown' } },
      },
    },
    '/api/chat/stream': {
      post: {
        tags: ['Conversational AI (Gemini)'],
        summary: 'Conversational Sales Intelligence using Gemini Tool-Calling (SSE Stream)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatMessageInput' } } },
        },
        responses: {
          200: {
            description: 'Server-Sent Events (SSE) token stream with event types: status, chunk, done',
          },
        },
      },
    },
  },
};
