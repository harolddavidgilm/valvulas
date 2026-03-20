'use client';

import { useAuth } from '@/context/AuthContext';
import React from 'react';

type Role = 'admin' | 'supervisor' | 'tecnico' | 'cliente';

interface HasPermissionProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HasPermission({ roles, children, fallback = null }: HasPermissionProps) {
  const { role, loading } = useAuth();

  if (loading) return null;

  // Admin has access to everything
  if (role === 'admin') return <>{children}</>;

  if (roles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
