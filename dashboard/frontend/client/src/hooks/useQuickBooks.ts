// Custom hooks for QuickBooks data using TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidateQueries } from '@/lib/queryClient';

// Customer hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => api.getCustomer(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Invoice hooks
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.getInvoice(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Estimate hooks
export function useEstimates() {
  return useQuery({
    queryKey: ['estimates'],
    queryFn: () => api.getEstimates(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: () => api.getEstimate(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Items hooks
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api.getItems(),
    staleTime: 1000 * 60 * 5,
  });
}

// Sync hooks
export function useSync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.triggerSync(),
    onSuccess: () => {
      // Invalidate all queries to refresh data
      invalidateQueries.all();
    },
    onError: (error) => {
      console.error('Sync failed:', error);
    },
  });
}

// Token status hook
export function useTokenStatus() {
  return useQuery({
    queryKey: ['tokenStatus'],
    queryFn: () => api.getTokenStatus(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// Dashboard stats hook
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getDashboardStats(),
    staleTime: 1000 * 60 * 5,
  });
}
