/**
 * Refresh QuickBooks OAuth tokens
 * This service runs every 50 minutes to refresh tokens before they expire
 */
export declare function refreshQuickBooksTokens(): Promise<void>;
/**
 * Schedule token refresh every 50 minutes
 */
export declare function scheduleTokenRefresh(): void;
/**
 * Manual token refresh (for testing or immediate needs)
 */
export declare function manualTokenRefresh(): Promise<boolean>;
//# sourceMappingURL=tokenRefresher.d.ts.map