import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Viewer' | 'Editor' | 'Admin';
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, pass: string) => {
    try {
      // First, try to find the user by email
      let q = query(collection(db, 'users'), where('email', '==', identifier));
      let snapshot = await getDocs(q);
      
      // If not found by email, try by username
      if (snapshot.empty) {
        q = query(collection(db, 'users'), where('username', '==', identifier));
        snapshot = await getDocs(q);
      }

      if (snapshot.empty) {
        throw new Error('Invalid credentials');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      const isValid = bcrypt.compareSync(pass, userData.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const loggedInUser: User = {
        id: userDoc.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };

      setUser(loggedInUser);
      localStorage.setItem('admin_user', JSON.stringify(loggedInUser));
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        throw new Error('Database permission denied. Please check Firestore rules.');
      }
      throw new Error(error.message || 'Failed to login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
