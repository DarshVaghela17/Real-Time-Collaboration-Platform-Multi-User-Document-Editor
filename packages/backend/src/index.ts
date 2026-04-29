import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config/environment.js';
import { connectDatabase } from './config/database';
import routes from './routes';
import { initializeSocket } from './socket';
import authRoutes from './routes/auth.routes';
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';
import tokenBlacklistService from './services/token.service';

const app: Application = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Make io accessible in routes if needed
app.set('io', io);

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiting (100 requests per 15 minutes per IP)
app.use(globalRateLimiter);

// Apply stricter rate limiting to auth endpoints (5 attempts per 15 minutes per IP)
app.use('/api/auth', authRateLimiter, authRoutes);

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', routes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Real-time Collaboration Platform API',
    version: '1.0.0',
    socket: 'Socket.io enabled',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me (Protected)',
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize token blacklist service
    await tokenBlacklistService.initialize();
    
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📝 Environment: ${config.env}`);
      console.log(`🔌 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();