import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { logger } from '../utils/logger.js';

// Stack Auth configuration
const STACK_AUTH_URL = process.env.STACK_AUTH_URL || 'https://api.stack-auth.com';
const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID || '5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06';
const JWKS_URI = `${STACK_AUTH_URL}/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json`;

// Create JWKS client
const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Get signing key from JWKS
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to verify JWT tokens from Stack Auth
 */
export const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authorization header provided' 
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
      return;
    }

    // Verify the JWT token
    jwt.verify(token, getKey, {
      algorithms: ['ES256'],
      issuer: STACK_AUTH_URL,
      audience: process.env.STACK_AUTH_AUDIENCE,
    }, (err, decoded) => {
      if (err) {
        logger.error('JWT verification failed:', err);
        res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Invalid token' 
        });
        return;
      }

      // Add user info to request
      if (decoded && typeof decoded === 'object') {
        req.user = {
          id: decoded.sub as string,
          email: decoded.email as string,
          role: decoded.role as string || 'user',
          ...decoded
        };
      }

      next();
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }

    // Verify the JWT token
    jwt.verify(token, getKey, {
      algorithms: ['ES256'],
      issuer: STACK_AUTH_URL,
      audience: process.env.STACK_AUTH_AUDIENCE,
    }, (err, decoded) => {
      if (err) {
        logger.warn('Optional auth failed:', err.message);
        next();
        return;
      }

      // Add user info to request
      if (decoded && typeof decoded === 'object') {
        req.user = {
          id: decoded.sub as string,
          email: decoded.email as string,
          role: decoded.role as string || 'user',
          ...decoded
        };
      }

      next();
    });
  } catch (error) {
    logger.warn('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Development middleware for testing (bypasses auth in development)
 */
export const devAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true') {
    // Mock user for development
    req.user = {
      id: 'dev-user-001',
      email: 'dev@marinpestcontrol.com',
      role: 'admin',
    };
    next();
    return;
  }

  // In production, use real auth
  verifyAuth(req, res, next);
};

