// Mock API client for frontend-only version
// This replaces backend API calls with mock data

export interface MockApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

// Mock data
const mockCustomers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '555-0123' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0456' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0789' },
];

const mockProducts = [
  { id: '1', name: 'Pest Control Service', price: 150, category: 'Service' },
  { id: '2', name: 'Termite Inspection', price: 200, category: 'Inspection' },
  { id: '3', name: 'Monthly Maintenance', price: 100, category: 'Service' },
];

const mockInvoices = [
  { id: '1', customer: 'John Doe', amount: 150, status: 'paid', date: '2024-01-15' },
  { id: '2', customer: 'Jane Smith', amount: 200, status: 'pending', date: '2024-01-16' },
  { id: '3', customer: 'Bob Johnson', amount: 100, status: 'overdue', date: '2024-01-10' },
];

const mockEmployees = [
  { id: '1', name: 'Alice Technician', role: 'Technician', email: 'alice@company.com' },
  { id: '2', name: 'Charlie Manager', role: 'Manager', email: 'charlie@company.com' },
];

// Mock API functions
export const mockApiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<MockApiResponse<T>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const method = options.method || 'GET';
  const url = new URL(endpoint, 'http://localhost');

  switch (url.pathname) {
    case '/api/customers':
      return { data: mockCustomers, success: true };
    
    case '/api/products':
      return { data: mockProducts, success: true };
    
    case '/api/invoices':
      return { data: mockInvoices, success: true };
    
    case '/api/employees':
      return { data: mockEmployees, success: true };
    
    case '/api/integrations':
      return { 
        data: [
          { provider: 'quickbooks', connected: false, syncStatus: 'pending' },
          { provider: 'google', connected: true, syncStatus: 'success' }
        ], 
        success: true 
      };
    
    case '/api/sync/status':
      return { 
        data: {
          integrations: [
            { provider: 'quickbooks', isActive: false, lastSyncAt: null, syncStatus: 'pending' },
            { provider: 'google', isActive: true, lastSyncAt: new Date().toISOString(), syncStatus: 'success' }
          ],
          recentLogs: []
        }, 
        success: true 
      };
    
    case '/api/auth/me':
      return { 
        data: { 
          id: '1', 
          name: 'Demo User', 
          email: 'demo@example.com', 
          role: 'admin' 
        }, 
        success: true 
      };
    
    default:
      return { 
        data: null, 
        success: false, 
        message: `Mock API: Endpoint ${endpoint} not implemented` 
      };
  }
};

// Mock React Query functions
export const mockUseQuery = <T = any>(queryKey: string[], options: any = {}) => {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await mockApiRequest<T>(queryKey[0]);
        if (response.success) {
          setData(response.data);
        } else {
          setError(new Error(response.message || 'API Error'));
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryKey[0]]);

  return { data, isLoading, error, refetch: () => {} };
};

export const mockUseMutation = <T = any, V = any>(options: any = {}) => {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const mutate = async (variables: V) => {
    try {
      setIsPending(true);
      setError(null);
      
      if (options.mutationFn) {
        const result = await options.mutationFn(variables);
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      }
    } catch (err) {
      setError(err as Error);
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
};

// Import React for the hooks
import React from 'react';
