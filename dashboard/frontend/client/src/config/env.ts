// Environment configuration for Marin Pest Control Dashboard

export const config = {
  // Backend API URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Stack Auth configuration
  stackAuthUrl: import.meta.env.VITE_STACK_AUTH_URL || '',
  stackAuthClientId: import.meta.env.VITE_STACK_AUTH_CLIENT_ID || '',
  
  // Development flags
  isDev: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  mockAuth: import.meta.env.VITE_MOCK_AUTH === 'true' || import.meta.env.DEV,
  
  // App configuration
  appName: 'Marin Pest Control Dashboard',
  version: '2.0.0',
} as const;

export default config;
