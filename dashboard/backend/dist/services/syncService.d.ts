/**
 * Sync all QuickBooks data to local database
 */
export declare function syncAllQuickBooksData(): Promise<void>;
/**
 * Sync specific entity type
 */
export declare function syncEntityType(entityType: 'customers' | 'items' | 'invoices' | 'estimates'): Promise<void>;
/**
 * Schedule hourly sync
 */
export declare function scheduleHourlySync(): void;
/**
 * Get sync status and statistics
 */
export declare function getSyncStatus(): Promise<{
    lastSync: Date | null;
    tokenStatus: 'valid' | 'invalid' | 'expired' | 'missing';
    recordCounts: {
        customers: number;
        items: number;
        invoices: number;
        estimates: number;
    };
}>;
//# sourceMappingURL=syncService.d.ts.map