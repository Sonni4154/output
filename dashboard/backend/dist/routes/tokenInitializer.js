import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
/**
 * Initialize QuickBooks tokens from environment variables
 * This is useful for initial setup when you have tokens from QuickBooks OAuth flow
 */
export async function initializeTokensFromEnv() {
    try {
        const accessToken = process.env.QBO_INITIAL_ACCESS_TOKEN;
        const refreshToken = process.env.QBO_REFRESH_ACCESS_TOKEN;
        const realmId = process.env.QBO_REALM_ID;
        if (!accessToken || !refreshToken || !realmId) {
            logger.warn('QuickBooks tokens not found in environment variables');
            return;
        }
        // Check if token already exists for this realm
        const [existingToken] = await db
            .select()
            .from(tokens)
            .where(eq(tokens.realm_id, realmId));
        if (existingToken) {
            logger.info(`Token already exists for realm ${realmId}, skipping initialization`);
            return;
        }
        // Calculate expiration time (QuickBooks tokens typically expire in 1 hour)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        // Insert the token
        await db.insert(tokens).values({
            id: Date.now(), // Use timestamp as ID
            access_token: accessToken,
            refresh_token: refreshToken,
            realm_id: realmId,
            expires_at: expiresAt,
            created_at: new Date(),
            last_updated: new Date(),
        });
        logger.info(`✅ QuickBooks token initialized for realm ${realmId}`);
    }
    catch (error) {
        logger.error('❌ Failed to initialize QuickBooks tokens:', error);
        throw error;
    }
}
/**
 * Check if we have valid QuickBooks tokens
 */
export async function hasValidTokens() {
    try {
        const [token] = await db
            .select()
            .from(tokens)
            .orderBy(tokens.last_updated)
            .limit(1);
        if (!token) {
            return false;
        }
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(token.expires_at);
        return now < expiresAt;
    }
    catch (error) {
        logger.error('Error checking token validity:', error);
        return false;
    }
}
//# sourceMappingURL=tokenInitializer.js.map