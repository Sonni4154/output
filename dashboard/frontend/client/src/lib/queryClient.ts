import { QueryClient } from "@tanstack/react-query";
import { apiClient } from './api';

// Create a new QueryClient with optimized settings for QuickBooks backend
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes to balance freshness and performance
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Background refetch every 10 minutes for critical data
      refetchInterval: 1000 * 60 * 10, // 10 minutes
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Helper function to invalidate related queries after mutations
export const invalidateQueries = {
  customers: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  invoices: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  estimates: () => queryClient.invalidateQueries({ queryKey: ['estimates'] }),
  items: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  sync: () => queryClient.invalidateQueries({ queryKey: ['sync'] }),
  tokenStatus: () => queryClient.invalidateQueries({ queryKey: ['tokenStatus'] }),
  dashboardStats: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch functions for better UX
export const prefetchQueries = {
  customers: () => queryClient.prefetchQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.get('/api/customers').then(res => res.data),
    staleTime: 1000 * 60 * 5,
  }),
  invoices: () => queryClient.prefetchQuery({
    queryKey: ['invoices'],
    queryFn: () => apiClient.get('/api/invoices').then(res => res.data),
    staleTime: 1000 * 60 * 5,
  }),
  estimates: () => queryClient.prefetchQuery({
    queryKey: ['estimates'],
    queryFn: () => apiClient.get('/api/estimates').then(res => res.data),
    staleTime: 1000 * 60 * 5,
  }),
  items: () => queryClient.prefetchQuery({
    queryKey: ['items'],
    queryFn: () => apiClient.get('/api/items').then(res => res.data),
    staleTime: 1000 * 60 * 5,
  }),
};

// Legacy API request function for backward compatibility
export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json();
}