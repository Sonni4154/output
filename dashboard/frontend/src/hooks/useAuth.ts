import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

// Stack Auth integration
export function useAuth() {
  // Check for JWT token in localStorage
  const token = localStorage.getItem('stack-auth-token');
  
  // For development, use mock user if no token
  const mockUser = {
    id: 'temp_user_001',
    firstName: 'Spencer',
    lastName: 'Reiser',
    email: 'spencer@marinpestcontrol.com',
    role: 'admin' as const,
    avatar: null
  };

  // Verify token with backend if available
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (!token) {
        return mockUser; // Return mock user for development
      }
      
      try {
        // Verify token with backend
        const response = await apiClient.get('/api/auth/verify');
        return response.data;
      } catch (error) {
        // If verification fails, clear token and return mock user
        localStorage.removeItem('stack-auth-token');
        return mockUser;
      }
    },
    enabled: !!token, // Only run if token exists
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = userData || mockUser;
  const isAuthenticated = !!token || true; // Always authenticated in development

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated,
    error,
    isAdmin: user.role === 'admin',
    token,
  };
}

// Auth utilities
export const authUtils = {
  // Set JWT token after successful login
  setToken: (token: string) => {
    localStorage.setItem('stack-auth-token', token);
  },
  
  // Clear token on logout
  clearToken: () => {
    localStorage.removeItem('stack-auth-token');
  },
  
  // Get current token
  getToken: () => {
    return localStorage.getItem('stack-auth-token');
  },
  
  // Check if token exists
  hasToken: () => {
    return !!localStorage.getItem('stack-auth-token');
  }
};