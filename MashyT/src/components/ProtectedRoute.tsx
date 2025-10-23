// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireUser = false
}) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminUserStr = localStorage.getItem('adminUser');
  const userToken = localStorage.getItem('auth_token');
  
  console.log('🔒 ProtectedRoute check:', { 
    requireAdmin, 
    requireUser, 
    hasAdminToken: !!adminToken, 
    hasAdminUser: !!adminUserStr,
    hasUserToken: !!userToken 
  });
  
  // Check for admin access
  if (requireAdmin) {
    if (!adminToken || !adminUserStr) {
      console.log('❌ Admin access denied: missing token or user data');
      return <Navigate to="/admin/login" replace />;
    }
    
    try {
      const user = JSON.parse(adminUserStr);
      if (user.role !== 'admin') {
        console.log('❌ Admin access denied: user role is not admin');
        return <Navigate to="/admin/login" replace />;
      }
      console.log('✅ Admin access granted');
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      return <Navigate to="/admin/login" replace />;
    }
  }
  
  // Check for regular user access
  if (requireUser) {
    if (!userToken) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
