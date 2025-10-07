import { Request, Response, NextFunction } from 'express';
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
export declare const verifyAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user has admin role
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has specific role
 */
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Development middleware for testing (bypasses auth in development)
 */
export declare const devAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map