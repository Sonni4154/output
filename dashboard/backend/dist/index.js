import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { verifyAuth, devAuth } from './middleware/auth.js';
import { initializeTokensFromEnv } from './services/tokenInitializer.js';
// Import routes
import customersRouter from './routes/customers.js';
import invoicesRouter from './routes/invoices.js';
import estimatesRouter from './routes/estimates.js';
import itemsRouter from './routes/items.js';
import syncRouter from './routes/sync.js';
import tokensRouter from './routes/tokens.js';
import webhookRouter from './routes/webhook.js';
import calendarRouter from './routes/calendar.js';
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
// Compression middleware
app.use(compression());
// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    next();
});
// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Marin Pest Control Backend is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});
// Webhook endpoints (no auth required)
app.use('/api/webhook', webhookRouter);
// Protected API routes (require authentication)
app.use('/api/customers', devAuth, customersRouter);
app.use('/api/invoices', devAuth, invoicesRouter);
app.use('/api/estimates', devAuth, estimatesRouter);
app.use('/api/items', devAuth, itemsRouter);
app.use('/api/sync', devAuth, syncRouter);
app.use('/api/tokens', devAuth, tokensRouter);
// Calendar, scheduling, and employee routes
app.use('/api/calendar', devAuth, calendarRouter);
app.use('/api/employees', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/assignments', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/notes', devAuth, calendarRouter); // Nested in calendar router
app.use('/api/clock', devAuth, calendarRouter); // Nested in calendar router
// Auth verification endpoint
app.get('/api/auth/verify', verifyAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user,
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    });
});
// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
});
// Initialize server
async function startServer() {
    try {
        // Initialize QuickBooks tokens from environment if available
        if (process.env.QBO_INITIAL_ACCESS_TOKEN) {
            logger.info('🔑 Initializing QuickBooks tokens from environment...');
            await initializeTokensFromEnv();
        }
        // Start the server
        app.listen(PORT, () => {
            logger.info(`🚀 Marin Pest Control Backend started successfully!`);
            logger.info(`📍 Server running on port ${PORT}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`📊 API base URL: http://localhost:${PORT}/api`);
            logger.info(`🔔 Webhook endpoint: http://localhost:${PORT}/api/webhook/quickbooks`);
            if (process.env.NODE_ENV === 'development') {
                logger.info(`🔓 Auth verification: http://localhost:${PORT}/api/auth/verify`);
                logger.info(`📋 Webhook health: http://localhost:${PORT}/api/webhook/health`);
            }
        });
    }
    catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map