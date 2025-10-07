import { Router } from 'express';
import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { qboClient } from '../services/qboClient.js';
import { logger } from '../utils/logger.js';
const router = Router();
/**
 * GET /api/tokens/status
 * Get current token status and validity
 */
router.get('/status', async (req, res) => {
    try {
        // Get the most recent token
        const [token] = await db
            .select()
            .from(tokens)
            .orderBy(tokens.last_updated)
            .limit(1);
        if (!token) {
            return res.json({
                success: true,
                data: {
                    hasToken: false,
                    isValid: false,
                    status: 'no_token',
                    message: 'No QuickBooks token found',
                },
            });
        }
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(token.expires_at);
        const isExpired = now >= expiresAt;
        if (isExpired) {
            return res.json({
                success: true,
                data: {
                    hasToken: true,
                    isValid: false,
                    status: 'expired',
                    message: 'Token has expired',
                    expiresAt: expiresAt.toISOString(),
                    realmId: token.realm_id,
                },
            });
        }
        // Test token validity with QuickBooks API
        let isValid = false;
        let companyInfo = null;
        try {
            isValid = await qboClient.testToken(token.realm_id);
            if (isValid) {
                companyInfo = await qboClient.getCompanyInfo(token.realm_id);
            }
        }
        catch (error) {
            logger.warn('Token validation failed:', error);
        }
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));
        res.json({
            success: true,
            data: {
                hasToken: true,
                isValid,
                status: isValid ? 'valid' : 'invalid',
                message: isValid ? 'Token is valid' : 'Token is invalid',
                expiresAt: expiresAt.toISOString(),
                minutesUntilExpiry,
                realmId: token.realm_id,
                companyInfo: companyInfo ? {
                    companyName: companyInfo.CompanyName,
                    legalName: companyInfo.LegalName,
                    companyAddr: companyInfo.CompanyAddr,
                } : null,
                lastUpdated: token.last_updated.toISOString(),
            },
        });
    }
    catch (error) {
        logger.error('Error getting token status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get token status',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /api/tokens/info
 * Get detailed token information (admin only)
 */
router.get('/info', async (req, res) => {
    try {
        // Get all tokens (for admin review)
        const allTokens = await db
            .select()
            .from(tokens)
            .orderBy(tokens.last_updated);
        const tokenInfo = allTokens.map(token => ({
            id: token.id,
            realmId: token.realm_id,
            expiresAt: token.expires_at.toISOString(),
            lastUpdated: token.last_updated.toISOString(),
            createdAt: token.created_at.toISOString(),
            // Don't expose actual tokens in response
            hasAccessToken: !!token.access_token,
            hasRefreshToken: !!token.refresh_token,
        }));
        res.json({
            success: true,
            data: {
                tokens: tokenInfo,
                count: tokenInfo.length,
            },
        });
    }
    catch (error) {
        logger.error('Error getting token info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get token information',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * DELETE /api/tokens/:id
 * Delete a specific token (admin only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tokenId = parseInt(id, 10);
        if (isNaN(tokenId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token ID',
            });
        }
        const [deletedToken] = await db
            .delete(tokens)
            .where(eq(tokens.id, tokenId))
            .returning();
        if (!deletedToken) {
            return res.status(404).json({
                success: false,
                error: 'Token not found',
            });
        }
        logger.info(`Token ${tokenId} deleted by admin`);
        res.json({
            success: true,
            message: 'Token deleted successfully',
            data: {
                id: deletedToken.id,
                realmId: deletedToken.realm_id,
            },
        });
    }
    catch (error) {
        logger.error(`Error deleting token ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete token',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export default router;
//# sourceMappingURL=tokens.js.map