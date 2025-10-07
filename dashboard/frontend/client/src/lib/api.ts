// Frontend API functions for QuickBooks Backend Integration
import axios from 'axios';

// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://23.128.116.9:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stack-auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('stack-auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// QuickBooks Backend API functions
export const api = {
  // Customer operations
  async getCustomers() {
    try {
      const response = await apiClient.get('/api/customers');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { data: [], success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getCustomer(id: string) {
    try {
      const response = await apiClient.get(`/api/customers/${id}`);
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Invoice operations
  async getInvoices() {
    try {
      const response = await apiClient.get('/api/invoices');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { data: [], success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getInvoice(id: string) {
    try {
      const response = await apiClient.get(`/api/invoices/${id}`);
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Estimate operations
  async getEstimates() {
    try {
      const response = await apiClient.get('/api/estimates');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching estimates:', error);
      return { data: [], success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getEstimate(id: string) {
    try {
      const response = await apiClient.get(`/api/estimates/${id}`);
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching estimate:', error);
      return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Items operations
  async getItems() {
    try {
      const response = await apiClient.get('/api/items');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching items:', error);
      return { data: [], success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Sync operations
  async triggerSync() {
    try {
      const response = await apiClient.post('/api/sync');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error triggering sync:', error);
      return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Token status
  async getTokenStatus() {
    try {
      const response = await apiClient.get('/api/tokens/status');
      return { data: response.data, success: true };
    } catch (error) {
      console.error('Error fetching token status:', error);
      return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Dashboard stats (computed from QuickBooks data)
  async getDashboardStats() {
    try {
      const [customersRes, invoicesRes, estimatesRes] = await Promise.all([
        this.getCustomers(),
        this.getInvoices(),
        this.getEstimates()
      ]);

      const stats = {
        customers: customersRes.data?.length || 0,
        invoices: invoicesRes.data?.length || 0,
        estimates: estimatesRes.data?.length || 0,
        totalRevenue: invoicesRes.data?.reduce((sum: number, inv: any) => sum + (inv.totalamt || 0), 0) || 0
      };

      return { data: stats, success: true };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: { customers: 0, invoices: 0, estimates: 0, totalRevenue: 0 }, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export { apiClient };