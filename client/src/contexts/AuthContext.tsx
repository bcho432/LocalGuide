import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      authService.getProfile()
        .then((user) => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        })
        .catch(() => {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      toast.success('Welcome back!');
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.register(name, email, password);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      toast.success('Account created successfully!');
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
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