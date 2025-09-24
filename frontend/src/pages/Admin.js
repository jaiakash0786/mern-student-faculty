import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Admin management page - coming soon</p>
    </div>
  );
};

export default Admin;