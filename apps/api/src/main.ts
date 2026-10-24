import path from 'path';
import dotenv from 'dotenv';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const port = process.env.API_PORT || process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error_or_offline';
  }

  res.json({
    status: 'ok',
    service: 'bd-commerce-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Basic API routes
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to BD Commerce Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
    },
  });
});

app.listen(port, () => {
  console.log(`🚀 BD Commerce API server running at http://localhost:${port}`);
  console.log(`📊 Health check available at http://localhost:${port}/health`);
});
