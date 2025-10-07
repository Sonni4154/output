import { useState, useEffect } from 'react';

// Mock StackAuth for now - we'll implement proper auth later
const mockStackAuth = {
  useUser: () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      // Mock user data
      setUser({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      });
      setLoading(false);
    }, []);
    
    return { user, loading };
  },
  
  signIn: () => {
    console.log('Mock sign in');
  },
  
  signOut: () => {
    console.log('Mock sign out');
  }
};

export default mockStackAuth;
