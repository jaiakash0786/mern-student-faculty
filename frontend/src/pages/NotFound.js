import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard">
        <button style={{ 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          padding: '0.75rem 1.5rem', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Go to Dashboard
        </button>
      </Link>
    </div>
  );
};

export default NotFound;