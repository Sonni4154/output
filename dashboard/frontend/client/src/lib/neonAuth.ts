// Neon Auth integration for React
// This file handles authentication using Neon Auth (formerly Stack Auth)

// Import React hooks
import { useState, useEffect } from 'react';

// Note: Stack Auth client initialization is handled separately in the backend
// For frontend, we use API calls to communicate with the auth endpoints

// Auth configuration
export const authConfig = {
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  baseUrl: import.meta.env.VITE_NEXTAUTH_URL || 'http://localhost:3000',
};

// Auth state management
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  isActive: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth functions
export const auth = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Sign in failed');
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!response.ok) {
        throw new Error('Sign up failed');
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<AuthUser>) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Password change failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Auth hook for React components
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await auth.getCurrentUser();
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password);
    if (result.success) {
      setAuthState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true,
      });
    }
    return result;
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const result = await auth.signUp(email, password, firstName, lastName);
    if (result.success) {
      setAuthState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true,
      });
    }
    return result;
  };

  const signOut = async () => {
    const result = await auth.signOut();
    if (result.success) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
    return result;
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    const result = await auth.updateProfile(updates);
    if (result.success) {
      setAuthState(prev => ({
        ...prev,
        user: result.user,
      }));
    }
    return result;
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refresh: () => auth.getCurrentUser().then(user => {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    }),
  };
};

// Import React hooks
import { useState, useEffect } from 'react';
