'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import useAuth, { AuthUser } from '@/hooks/useAuth';

interface AuthContextValue {
  user: AuthUser;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthGuard');
  }
  return ctx;
}

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = ['/login'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/hosted-zones');
    }
  }, [loading, isAuthenticated, isPublicRoute, router]);

  // Show spinner while loading
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f2f3f3',
        }}
      >
        <Box textAlign="center">
          <Spinner size="large" />
          <Box padding={{ top: 's' }} color="text-body-secondary">
            Loading...
          </Box>
        </Box>
      </div>
    );
  }

  // Not authenticated and not on a public route — redirect in progress
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  // On a public route (login) — render without AuthContext
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Authenticated — provide context
  return (
    <AuthContext.Provider value={{ user: user!, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
