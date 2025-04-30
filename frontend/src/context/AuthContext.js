import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// Define the base URL for your API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create the context
const AuthContext = createContext();

// Helper function to set the Axios authorization header
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("Axios default auth header set.");
  } else {
    delete axios.defaults.headers.common["Authorization"];
    console.log("Axios default auth header removed.");
  }
};

// Helper function to test localStorage availability
const testLocalStorage = () => {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return true;
  } catch (e) {
    console.error("localStorage is not available:", e);
    return false;
  }
};

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Initialize states with values from localStorage
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setAuthToken(savedToken);
      return savedToken;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  // Debug effect to track token changes
  useEffect(() => {
    console.log("Token state changed:", token);
    console.log("localStorage token:", localStorage.getItem("token"));
  }, [token]);

  // Set up axios interceptor for token handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Effect to load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          const response = await axios.get(`${API_URL}/auth/me`);
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(response.data));
          console.log("User loaded successfully:", response.data);
        } catch (error) {
          console.error("Failed to load user:", error.message);
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      // Validate credentials before sending
      if (!credentials.email || !credentials.password) {
        throw new Error('Please provide both email and password');
      }
  
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
      const response = await axios.post(
        `${API_URL}/auth/login`,
        credentials,
        config
      );
  
      const { token, user } = response.data;
  
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
  
      // Set token in axios headers
      setAuthToken(token);
  
      // Update localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
  
      // Update state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
  
      return user;
  
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      if (response.data.token) {
        // Set token in axios headers
        setAuthToken(response.data.token);

        // Update localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Update state
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        setLoading(false);

        console.log("Registration successful");
        return response.data;
      }
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data?.msg || error.message
      );
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setLoading(false);
      console.log("Logout successful");
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        token: token,
      });
      const newToken = response.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setAuthToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error.message);
      logout();
      throw error;
    }
  };

  const value = {
    token,
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;