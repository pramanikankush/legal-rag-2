import { User } from '../types';

const USER_KEY = 'lexai_user_session';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    // Mock successful login
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: 'attorney',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signup: async (email: string, password: string, name: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email || !password || !name) {
      throw new Error('All fields are required.');
    }

    const user: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'attorney',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  updateProfile: async (user: User, updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
};