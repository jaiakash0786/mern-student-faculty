import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;