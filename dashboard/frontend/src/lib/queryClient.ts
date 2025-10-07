import { QueryClient } from '@tanstack/react-query';
import { apiClient } from './api';

// Create a query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchInterval: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Helper functions for query invalidation and prefetching
export const invalidateQueries = {
  customers: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  invoices: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  estimates: () => queryClient.invalidateQueries({ queryKey: ['estimates'] }),
  items: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  tokenStatus: () => queryClient.invalidateQueries({ queryKey: ['tokenStatus'] }),
  dashboardStats: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }),
};

export const prefetchQueries = {
  customers: () => queryClient.prefetchQuery({ queryKey: ['customers'], queryFn: () => api.getCustomers() }),
  invoices: () => queryClient.prefetchQuery({ queryKey: ['invoices'], queryFn: () => api.getInvoices() }),
  estimates: () => queryClient.prefetchQuery({ queryKey: ['estimates'], queryFn: () => api.getEstimates() }),
  items: () => queryClient.prefetchQuery({ queryKey: ['items'], queryFn: () => api.getItems() }),
};

// Compatibility layer for old components
export const apiRequest = async (endpoint: string, method: string = 'GET', data?: any) => {
  console.warn('apiRequest is deprecated. Please use api from @/lib/api instead.');
  
  try {
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await apiClient.get(endpoint);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, data);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    return { data: response.data, success: true };
  } catch (error) {
    console.error(`Error in apiRequest for ${endpoint}:`, error);
    return { data: null, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
