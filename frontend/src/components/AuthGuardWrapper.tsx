'use client';

import AuthGuard from '@/components/AuthGuard';
import NotificationProvider from '@/components/Notifications';

/**
 * Thin client-component wrapper so we can use AuthGuard (which uses hooks)
 * from the server-component root layout.
 */
export default function AuthGuardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <AuthGuard>{children}</AuthGuard>
    </NotificationProvider>
  );
}
