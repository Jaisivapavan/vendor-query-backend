import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';

// Load environment variables
dotenv.config();

// Route imports
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import reportRoutes from './routes/report.routes';
import chatRoutes from './routes/chat.routes';

const app: Application = express();

// Security and utility middleware
// Disable strict CSP for Swagger UI and static frontend charts/icons
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json());

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI Interactive API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Base health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    system: 'VendorQuery API',
    timestamp: new Date().toISOString(),
  });
});

// JSON API directory endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to VendorQuery - Conversational Sales Intelligence & POS API',
    documentation: '/docs',
    endpoints: {
      auth: '/api/auth',
      menu: '/api/menu',
      orders: '/api/orders',
      reports: '/api/reports',
      chat: '/api/chat/stream',
      health: '/health',
    },
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// Fallback to index.html for root if not handled by static
app.get('/', (_req: Request, res: Response) => {
  const publicIndex = path.join(__dirname, '../public/index.html');
  res.sendFile(publicIndex, (err) => {
    if (err) {
      res.redirect('/docs');
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    documentation: '/docs',
  });
});

// Global error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

export default app;
