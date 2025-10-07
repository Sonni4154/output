export interface QboConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment: 'sandbox' | 'production';
}
export declare class QuickBooksClient {
    private config;
    private baseUrl;
    constructor(config: QboConfig);
    /**
     * Get the current access token from database or environment
     */
    private getAccessToken;
    /**
     * Create authenticated axios instance
     */
    private createAuthenticatedClient;
    /**
     * Execute QuickBooks query
     */
    query(realmId: string, query: string): Promise<any>;
    /**
     * Get all customers
     */
    getCustomers(realmId: string): Promise<any[]>;
    /**
     * Get all invoices
     */
    getInvoices(realmId: string): Promise<any[]>;
    /**
     * Get all estimates
     */
    getEstimates(realmId: string): Promise<any[]>;
    /**
     * Get all items
     */
    getItems(realmId: string): Promise<any[]>;
    /**
     * Get company info
     */
    getCompanyInfo(realmId: string): Promise<any>;
    /**
     * Test token validity
     */
    testToken(realmId: string): Promise<boolean>;
    /**
     * Refresh access token
     */
    refreshToken(): Promise<void>;
}
export declare const qboClient: QuickBooksClient;
//# sourceMappingURL=qboClient.d.ts.map