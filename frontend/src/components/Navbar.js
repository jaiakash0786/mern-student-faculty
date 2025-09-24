import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#343a40',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          MERN Collab
        </Link>
        
        {user && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link to="/groups" style={{ color: 'white', textDecoration: 'none' }}>
              Groups
            </Link>
            <Link to="/tasks" style={{ color: 'white', textDecoration: 'none' }}>
              Tasks
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>
                Admin
              </Link>
            )}
          </div>
        )}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.name} ({user.role})</span>
          <button 
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;