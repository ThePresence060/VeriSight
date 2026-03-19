import React, { createContext, useContext, useReducer, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const initialState = {
  isAuthenticated: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'AUTH_ERROR':
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'UPDATE_USER': {
      const updatedUser = action.payload;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { ...state, user: updatedUser };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          // Real backend devs would call: const res = await client.get('/users/me');
          // For now, we simulate a successful profile fetch
          dispatch({ 
            type: 'RESTORE_AUTH', 
            payload: { 
              user: state.user || { name: 'User', email: 'user@example.com' }, 
              token: state.token 
            }
          });
        } catch (err) {
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      /**
       * BACKEND INTEGRATION:
       * Replace this mock block with an actual API call to your Python/FastAPI backend.
       * Example:
       * const res = await client.post('/auth/login', { email, password });
       * const { token, user } = res.data;
       * 
       * Expected user object structure from backend:
       * { 
       *   name: "John Doe", 
       *   email: "john@example.com",
       *   metrics: { reliable_views: 345, total_views: 890 } // <--- Dashboard needs this
       * }
       */
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = { 
            token: 'mock_token_' + Date.now(), 
            user: { 
              name: email.split('@')[0], 
              email,
              metrics: { reliable_views: 0, total_views: 0 } // Reset for development
            } 
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: mockData });
          resolve(mockData);
        }, 800);
      });
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      /**
       * BACKEND INTEGRATION:
       * Replace this mock block with an actual API call to your signup endpoint.
       * const res = await client.post('/auth/register', { name, email, password });
       */
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = { 
            token: 'mock_token_reg_' + Date.now(), 
            user: { 
              name, 
              email,
              metrics: { reliable_views: 0, total_views: 0 } // New users start at zero
            } 
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: mockData });
          resolve(mockData);
        }, 800);
      });
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
      throw err;
    }
  };

  const updateMetrics = async () => {
    if (!state.token || !state.user) return;
    try {
      // Increment total_views locally
      const currentMetrics = state.user.metrics || { reliable_views: 0, total_views: 0, posts_made: 0 };
      const updatedUser = {
        ...state.user,
        metrics: {
          ...currentMetrics,
          total_views: (currentMetrics.total_views || 0) + 1,
        },
      };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (err) {
      console.error("Failed to update metrics:", err);
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, signup, updateMetrics }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
