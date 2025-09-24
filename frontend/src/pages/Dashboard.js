import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name} ({user?.role})!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
