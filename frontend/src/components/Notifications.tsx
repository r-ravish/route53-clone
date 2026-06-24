'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Flashbar, { FlashbarProps } from '@cloudscape-design/components/flashbar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotifyOptions {
  type: NotificationType;
  content: string;
  header?: string;
  dismissible?: boolean;
  duration?: number; // ms, default 5000 for success/info, 8000 for error
}

interface NotificationContextValue {
  notify: (options: NotifyOptions) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// ---------------------------------------------------------------------------
// Provider + Flashbar
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const counterRef = useRef(0);

  const notify = useCallback((options: NotifyOptions) => {
    const id = String(++counterRef.current);
    const duration =
      options.duration ??
      (options.type === 'error' || options.type === 'warning' ? 8000 : 5000);

    const item: FlashbarProps.MessageDefinition = {
      id,
      type: options.type,
      content: options.content,
      header: options.header,
      dismissible: options.dismissible ?? true,
      onDismiss: () => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
    };

    setItems((prev) => [item, ...prev]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, duration);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {/* Full-width notification bar at the top, below the navbar + sub-header */}
      <div
        style={{
          position: 'fixed',
          top: '48px', // below navbar
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: items.length > 0 ? '0 0' : undefined,
        }}
      >
        <Flashbar items={items} />
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
