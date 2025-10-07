import axios from 'axios';
import { db, tokens } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
export class QuickBooksClient {
    config;
    baseUrl;
    constructor(config) {
        this.config = config;
        this.baseUrl = config.environment === 'sandbox'
            ? 'https://sandbox-quickbooks.api.intuit.com/v3/company'
            : 'https://quickbooks.api.intuit.com/v3/company';
    }
    /**
     * Get the current access token from database or environment
     */
    async getAccessToken() {
        // First try to get token from database
        const [token] = await db.select().from(tokens).orderBy(tokens.last_updated).limit(1);
        if (token) {
            // Check if token is expired
            if (new Date() >= token.expires_at) {
                throw new Error('QuickBooks access token has expired. Please refresh the token.');
            }
            return token.access_token;
        }
        // Fallback to environment variable for initial setup
        const envToken = process.env.QBO_INITIAL_ACCESS_TOKEN;
        if (envToken) {
            logger.info('Using initial access token from environment');
            return envToken;
        }
        throw new Error('No QuickBooks access token found. Please authenticate first.');
    }
    /**
     * Create authenticated axios instance
     */
    async createAuthenticatedClient(realmId) {
        const accessToken = await this.getAccessToken();
        return axios.create({
            baseURL: `${this.baseUrl}/${realmId}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }
    /**
     * Execute QuickBooks query
     */
    async query(realmId, query) {
        try {
            const client = await this.createAuthenticatedClient(realmId);
            const response = await client.post('/query', query, {
                headers: {
                    'Content-Type': 'application/text',
                },
            });
            return response.data.QueryResponse;
        }
        catch (error) {
            logger.error('QuickBooks query failed:', error);
            throw new Error(`QuickBooks query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get all customers
     */
    async getCustomers(realmId) {
        const query = 'SELECT * FROM Customer';
        const response = await this.query(realmId, query);
        return response?.Customer || [];
    }
    /**
     * Get all invoices
     */
    async getInvoices(realmId) {
        const query = 'SELECT * FROM Invoice';
        const response = await this.query(realmId, query);
        return response?.Invoice || [];
    }
    /**
     * Get all estimates
     */
    async getEstimates(realmId) {
        const query = 'SELECT * FROM Estimate';
        const response = await this.query(realmId, query);
        return response?.Estimate || [];
    }
    /**
     * Get all items
     */
    async getItems(realmId) {
        const query = 'SELECT * FROM Item';
        const response = await this.query(realmId, query);
        return response?.Item || [];
    }
    /**
     * Get company info
     */
    async getCompanyInfo(realmId) {
        try {
            const client = await this.createAuthenticatedClient(realmId);
            const response = await client.get('/companyinfo/1');
            return response.data.QueryResponse.CompanyInfo[0];
        }
        catch (error) {
            logger.error('Failed to get company info:', error);
            throw new Error(`Failed to get company info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test token validity
     */
    async testToken(realmId) {
        try {
            await this.getCompanyInfo(realmId);
            return true;
        }
        catch (error) {
            logger.error('Token test failed:', error);
            return false;
        }
    }
    /**
     * Refresh access token
     */
    async refreshToken() {
        try {
            const [currentToken] = await db.select().from(tokens).orderBy(tokens.last_updated).limit(1);
            if (!currentToken) {
                throw new Error('No refresh token found');
            }
            const response = await axios.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: currentToken.refresh_token,
            }), {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const { access_token, refresh_token, expires_in } = response.data;
            const expiresAt = new Date(Date.now() + expires_in * 1000);
            await db.update(tokens)
                .set({
                access_token,
                refresh_token: refresh_token || currentToken.refresh_token,
                expires_at: expiresAt,
                last_updated: new Date(),
            })
                .where(eq(tokens.id, currentToken.id));
            logger.info('QuickBooks token refreshed successfully');
        }
        catch (error) {
            logger.error('Failed to refresh QuickBooks token:', error);
            throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
// Create singleton instance
export const qboClient = new QuickBooksClient({
    clientId: process.env.QBO_CLIENT_ID || '',
    clientSecret: process.env.QBO_CLIENT_SECRET || '',
    redirectUri: process.env.QBO_REDIRECT_URI || '',
    environment: process.env.QBO_ENV || 'sandbox',
});
//# sourceMappingURL=qboClient.js.map