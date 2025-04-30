// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global styles
import App from './App'; // Your main application component
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider
import reportWebVitals from './reportWebVitals';

// Get the root element from your HTML
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    {/* Wrap the entire App component with AuthProvider */}
    {/* This makes the auth context (token, user, login, logout, etc.) */}
    {/* available to all components within App */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
