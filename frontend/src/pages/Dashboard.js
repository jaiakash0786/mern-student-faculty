import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name}!</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginTop: '2rem' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          border: '1px solid #ddd' 
        }}>
          <h3>Your Groups</h3>
          <p>Manage your collaboration groups</p>
          <Link to="/groups">
            <button style={{ 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View Groups
            </button>
          </Link>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          border: '1px solid #ddd' 
        }}>
          <h3>Tasks</h3>
          <p>View and manage your tasks</p>
          <Link to="/tasks">
            <button style={{ 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View Tasks
            </button>
          </Link>
        </div>

        {user?.role === 'faculty' && (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd' 
          }}>
            <h3>Faculty Tools</h3>
            <p>Create groups and assign tasks</p>
            <Link to="/groups/create">
              <button style={{ 
                background: '#ffc107', 
                color: 'black', 
                border: 'none', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Create Group
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;