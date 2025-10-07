import cron from 'node-cron';
import { qboClient } from './qboClient.js';
import { batchUpsertCustomers, batchUpsertItems, batchUpsertInvoices, batchUpsertEstimates } from './upserts.js';
import { db, tokens, customers, items, invoices, estimates } from '../db/index.js';
import { logger } from '../utils/logger.js';
/**
 * Sync all QuickBooks data to local database
 */
export async function syncAllQuickBooksData() {
    try {
        logger.info('🔄 Starting QuickBooks data synchronization...');
        // Get the current realm ID from tokens
        const [token] = await db.select().from(tokens).orderBy(tokens.last_updated).limit(1);
        if (!token) {
            throw new Error('No QuickBooks token found. Please authenticate first.');
        }
        const realmId = token.realm_id;
        logger.info(`📊 Syncing data for realm: ${realmId}`);
        // Test token validity first
        const isTokenValid = await qboClient.testToken(realmId);
        if (!isTokenValid) {
            throw new Error('QuickBooks token is invalid. Please refresh the token.');
        }
        // Sync customers
        logger.info('👥 Syncing customers...');
        const customers = await qboClient.getCustomers(realmId);
        await batchUpsertCustomers(customers);
        logger.info(`✅ Synced ${customers.length} customers`);
        // Sync items
        logger.info('📦 Syncing items...');
        const items = await qboClient.getItems(realmId);
        await batchUpsertItems(items);
        logger.info(`✅ Synced ${items.length} items`);
        // Sync invoices
        logger.info('🧾 Syncing invoices...');
        const invoices = await qboClient.getInvoices(realmId);
        await batchUpsertInvoices(invoices);
        logger.info(`✅ Synced ${invoices.length} invoices`);
        // Sync estimates
        logger.info('📋 Syncing estimates...');
        const estimates = await qboClient.getEstimates(realmId);
        await batchUpsertEstimates(estimates);
        logger.info(`✅ Synced ${estimates.length} estimates`);
        logger.info('🎉 QuickBooks data synchronization completed successfully');
    }
    catch (error) {
        logger.error('❌ QuickBooks data synchronization failed:', error);
        throw error;
    }
}
/**
 * Sync specific entity type
 */
export async function syncEntityType(entityType) {
    try {
        logger.info(`🔄 Starting ${entityType} synchronization...`);
        // Get the current realm ID from tokens
        const [token] = await db.select().from(tokens).orderBy(tokens.last_updated).limit(1);
        if (!token) {
            throw new Error('No QuickBooks token found. Please authenticate first.');
        }
        const realmId = token.realm_id;
        // Test token validity first
        const isTokenValid = await qboClient.testToken(realmId);
        if (!isTokenValid) {
            throw new Error('QuickBooks token is invalid. Please refresh the token.');
        }
        let count = 0;
        switch (entityType) {
            case 'customers':
                const customers = await qboClient.getCustomers(realmId);
                await batchUpsertCustomers(customers);
                count = customers.length;
                break;
            case 'items':
                const items = await qboClient.getItems(realmId);
                await batchUpsertItems(items);
                count = items.length;
                break;
            case 'invoices':
                const invoices = await qboClient.getInvoices(realmId);
                await batchUpsertInvoices(invoices);
                count = invoices.length;
                break;
            case 'estimates':
                const estimates = await qboClient.getEstimates(realmId);
                await batchUpsertEstimates(estimates);
                count = estimates.length;
                break;
        }
        logger.info(`✅ Synced ${count} ${entityType}`);
    }
    catch (error) {
        logger.error(`❌ ${entityType} synchronization failed:`, error);
        throw error;
    }
}
/**
 * Schedule hourly sync
 */
export function scheduleHourlySync() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        logger.info('⏰ Running scheduled QuickBooks data sync...');
        try {
            await syncAllQuickBooksData();
        }
        catch (error) {
            logger.error('❌ Scheduled sync failed:', error);
        }
    });
    logger.info('📅 Data sync scheduled to run every hour');
}
/**
 * Get sync status and statistics
 */
export async function getSyncStatus() {
    try {
        // Get token status
        const [token] = await db.select().from(tokens).orderBy(tokens.last_updated).limit(1);
        let tokenStatus = 'missing';
        let lastSync = null;
        if (token) {
            lastSync = token.last_updated;
            const now = new Date();
            const expiresAt = new Date(token.expires_at);
            if (now >= expiresAt) {
                tokenStatus = 'expired';
            }
            else {
                // Test token validity
                const isValid = await qboClient.testToken(token.realm_id);
                tokenStatus = isValid ? 'valid' : 'invalid';
            }
        }
        // Get record counts
        const recordCounts = {
            customers: await db.select().from(customers).then(rows => rows.length),
            items: await db.select().from(items).then(rows => rows.length),
            invoices: await db.select().from(invoices).then(rows => rows.length),
            estimates: await db.select().from(estimates).then(rows => rows.length),
        };
        return {
            lastSync,
            tokenStatus,
            recordCounts,
        };
    }
    catch (error) {
        logger.error('❌ Failed to get sync status:', error);
        throw error;
    }
}
// If this file is run directly, start the sync service
if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('🚀 Starting QuickBooks sync service...');
    // Run initial sync (don't exit on failure)
    syncAllQuickBooksData().catch((error) => {
        logger.warn('⚠️ Initial sync failed (will retry on schedule):', error);
    });
    // Schedule regular syncs
    scheduleHourlySync();
    // Keep the process alive
    process.on('SIGINT', () => {
        logger.info('🛑 Sync service shutting down...');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        logger.info('🛑 Sync service shutting down...');
        process.exit(0);
    });
    logger.info('✅ Sync service is running');
}
//# sourceMappingURL=syncService.js.map