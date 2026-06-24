'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SideNavigation, { SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import CloudscapeAppLayout from '@cloudscape-design/components/app-layout';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import { useAuthContext } from '@/components/AuthGuard';

// ---------------------------------------------------------------------------
// Navigation items — matches Route53 sidebar structure
// ---------------------------------------------------------------------------

const NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: 'link', text: 'Dashboard', href: '/dashboard' },
  { type: 'link', text: 'Hosted zones', href: '/hosted-zones' },
  { type: 'link', text: 'Health checks', href: '/health-checks' },
  { type: 'divider' },
  {
    type: 'section',
    text: 'Traffic flow',
    items: [
      { type: 'link', text: 'Traffic policies', href: '/traffic-policies' },
    ],
  },
  { type: 'divider' },
  {
    type: 'section',
    text: 'Resolver',
    items: [
      { type: 'link', text: 'Resolver', href: '/resolver' },
    ],
  },
  { type: 'divider' },
  {
    type: 'section',
    text: 'Profiles',
    items: [
      { type: 'link', text: 'Profiles', href: '/profiles' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Breadcrumb helper
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/hosted-zones': 'Hosted zones',
  '/health-checks': 'Health checks',
  '/traffic-policies': 'Traffic policies',
  '/resolver': 'Resolver',
  '/profiles': 'Profiles',
};

function buildBreadcrumbs(pathname: string) {
  const crumbs = [{ text: 'Route 53', href: '/dashboard' }];

  // Create hosted zone page
  if (pathname === '/hosted-zones/create') {
    crumbs.push({ text: 'Hosted zones', href: '/hosted-zones' });
    crumbs.push({ text: 'Create hosted zone', href: pathname });
  }
  // Create record page: /hosted-zones/[id]/create-record
  else if (/^\/hosted-zones\/\d+\/create-record$/.test(pathname)) {
    crumbs.push({ text: 'Hosted zones', href: '/hosted-zones' });
    const zoneId = pathname.split('/')[2];
    crumbs.push({ text: 'Zone details', href: `/hosted-zones/${zoneId}` });
    crumbs.push({ text: 'Create record', href: pathname });
  }
  // Edit zone page: /hosted-zones/[id]/edit
  else if (/^\/hosted-zones\/\d+\/edit$/.test(pathname)) {
    crumbs.push({ text: 'Hosted zones', href: '/hosted-zones' });
    const zoneId = pathname.split('/')[2];
    crumbs.push({ text: 'Zone details', href: `/hosted-zones/${zoneId}` });
    crumbs.push({ text: 'Edit', href: pathname });
  }
  // Zone detail page: /hosted-zones/[id]
  else if (/^\/hosted-zones\/\d+$/.test(pathname)) {
    crumbs.push({ text: 'Hosted zones', href: '/hosted-zones' });
    crumbs.push({ text: 'Zone details', href: pathname });
  } else if (ROUTE_LABELS[pathname]) {
    crumbs.push({ text: ROUTE_LABELS[pathname], href: pathname });
  }

  return crumbs;
}

// ---------------------------------------------------------------------------
// AppLayout component
// ---------------------------------------------------------------------------

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic user content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavFollow = useCallback(
    (e: CustomEvent<SideNavigationProps.FollowDetail>) => {
      e.preventDefault();
      router.push(e.detail.href);
    },
    [router]
  );

  return (
    <>
      {/* Single AWS-style top navigation bar */}
      <header id="top-nav" style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#161D26',
        height: '48px',
        color: '#d5dbdb',
        padding: '0 16px',
        fontSize: '14px',
        fontFamily: '"Amazon Ember", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'sticky',
        top: 0,
        zIndex: 1002,
        borderTop: '2px solid #5F6B7A'
      }}>
        {/* AWS Logo */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '16px' }} onClick={() => router.push('/dashboard')}>
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 182" width="36" height="20">
            <path fill="#ffffff" d="M86.4,66.4c0,3.7,0.4,6.7,1.1,8.9c0.8,2.2,1.8,4.6,3.2,7.2c0.5,0.8,0.7,1.6,0.7,2.3c0,1-0.6,2-1.9,3l-6.3,4.2c-0.9,0.6-1.8,0.9-2.6,0.9c-1,0-2-0.5-3-1.4C76.2,90,75,88.4,74,86.8c-1-1.7-2-3.6-3.1-5.9c-7.8,9.2-17.6,13.8-29.4,13.8c-8.4,0-15.1-2.4-20-7.2c-4.9-4.8-7.4-11.2-7.4-19.2c0-8.5,3-15.4,9.1-20.6c6.1-5.2,14.2-7.8,24.5-7.8c3.4,0,6.9,0.3,10.6,0.8c3.7,0.5,7.5,1.3,11.5,2.2v-7.3c0-7.6-1.6-12.9-4.7-16c-3.2-3.1-8.6-4.6-16.3-4.6c-3.5,0-7.1,0.4-10.8,1.3c-3.7,0.9-7.3,2-10.8,3.4c-1.6,0.7-2.8,1.1-3.5,1.3c-0.7,0.2-1.2,0.3-1.6,0.3c-1.4,0-2.1-1-2.1-3.1v-4.9c0-1.6,0.2-2.8,0.7-3.5c0.5-0.7,1.4-1.4,2.8-2.1c3.5-1.8,7.7-3.3,12.6-4.5c4.9-1.3,10.1-1.9,15.6-1.9c11.9,0,20.6,2.7,26.2,8.1c5.5,5.4,8.3,13.6,8.3,24.6V66.4z M45.8,81.6c3.3,0,6.7-0.6,10.3-1.8c3.6-1.2,6.8-3.4,9.5-6.4c1.6-1.9,2.8-4,3.4-6.4c0.6-2.4,1-5.3,1-8.7v-4.2c-2.9-0.7-6-1.3-9.2-1.7c-3.2-0.4-6.3-0.6-9.4-0.6c-6.7,0-11.6,1.3-14.9,4c-3.3,2.7-4.9,6.5-4.9,11.5c0,4.7,1.2,8.2,3.7,10.6C37.7,80.4,41.2,81.6,45.8,81.6z M126.1,92.4c-1.8,0-3-0.3-3.8-1c-0.8-0.6-1.5-2-2.1-3.9L96.7,10.2c-0.6-2-0.9-3.3-0.9-4c0-1.6,0.8-2.5,2.4-2.5h9.8c1.9,0,3.2,0.3,3.9,1c0.8,0.6,1.4,2,2,3.9l16.8,66.2l15.6-66.2c0.5-2,1.1-3.3,1.9-3.9c0.8-0.6,2.2-1,4-1h8c1.9,0,3.2,0.3,4,1c0.8,0.6,1.5,2,1.9,3.9l15.8,67l17.3-67c0.6-2,1.3-3.3,2-3.9c0.8-0.6,2.1-1,3.9-1h9.3c1.6,0,2.5,0.8,2.5,2.5c0,0.5-0.1,1-0.2,1.6c-0.1,0.6-0.3,1.4-0.7,2.5l-24.1,77.3c-0.6,2-1.3,3.3-2.1,3.9c-0.8,0.6-2.1,1-3.8,1h-8.6c-1.9,0-3.2-0.3-4-1c-0.8-0.7-1.5-2-1.9-4L156,23l-15.4,64.4c-0.5,2-1.1,3.3-1.9,4c-0.8,0.7-2.2,1-4,1H126.1z M254.6,95.1c-5.2,0-10.4-0.6-15.4-1.8c-5-1.2-8.9-2.5-11.5-4c-1.6-0.9-2.7-1.9-3.1-2.8c-0.4-0.9-0.6-1.9-0.6-2.8v-5.1c0-2.1,0.8-3.1,2.3-3.1c0.6,0,1.2,0.1,1.8,0.3c0.6,0.2,1.5,0.6,2.5,1c3.4,1.5,7.1,2.7,11,3.5c4,0.8,7.9,1.2,11.9,1.2c6.3,0,11.2-1.1,14.6-3.3c3.4-2.2,5.2-5.4,5.2-9.5c0-2.8-0.9-5.1-2.7-7c-1.8-1.9-5.2-3.6-10.1-5.2L246,52c-7.3-2.3-12.7-5.7-16-10.2c-3.3-4.4-5-9.3-5-14.5c0-4.2,0.9-7.9,2.7-11.1c1.8-3.2,4.2-6,7.2-8.2c3-2.3,6.4-4,10.4-5.2c4-1.2,8.2-1.7,12.6-1.7c2.2,0,4.5,0.1,6.7,0.4c2.3,0.3,4.4,0.7,6.5,1.1c2,0.5,3.9,1,5.7,1.6c1.8,0.6,3.2,1.2,4.2,1.8c1.4,0.8,2.4,1.6,3,2.5c0.6,0.8,0.9,1.9,0.9,3.3v4.7c0,2.1-0.8,3.2-2.3,3.2c-0.8,0-2.1-0.4-3.8-1.2c-5.7-2.6-12.1-3.9-19.2-3.9c-5.7,0-10.2,0.9-13.3,2.8c-3.1,1.9-4.7,4.8-4.7,8.9c0,2.8,1,5.2,3,7.1c2,1.9,5.7,3.8,11,5.5l14.2,4.5c7.2,2.3,12.4,5.5,15.5,9.6c3.1,4.1,4.6,8.8,4.6,14c0,4.3-0.9,8.2-2.6,11.6c-1.8,3.4-4.2,6.4-7.3,8.8c-3.1,2.5-6.8,4.3-11.1,5.6C264.4,94.4,259.7,95.1,254.6,95.1z" />
            <g>
              <path fill="#ffffff" d="M273.5,143.7c-32.9,24.3-80.7,37.2-121.8,37.2c-57.6,0-109.5-21.3-148.7-56.7c-3.1-2.8-0.3-6.6,3.4-4.4c42.4,24.6,94.7,39.5,148.8,39.5c36.5,0,76.6-7.6,113.5-23.2C274.2,133.6,278.9,139.7,273.5,143.7z" />
              <path fill="#ffffff" d="M287.2,128.1c-4.2-5.4-27.8-2.6-38.5-1.3c-3.2,0.4-3.7-2.4-0.8-4.5c18.8-13.2,49.7-9.4,53.3-5c3.6,4.5-1,35.4-18.6,50.2c-2.7,2.3-5.3,1.1-4.1-1.9C282.5,155.7,291.4,133.4,287.2,128.1z" />
            </g>
          </svg>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#3a424d', marginRight: '16px' }} />

        {/* Amazon Q */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '16px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'linear-gradient(135deg, #7433ff 0%, #0010f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="10" cy="11" r="2.5" fill="white" />
              <path d="M12 13L16 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#3a424d', marginRight: '16px' }} />

        {/* Services */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="3" height="3" rx="0.5" />
            <rect x="6" y="1" width="3" height="3" rx="0.5" />
            <rect x="11" y="1" width="3" height="3" rx="0.5" />
            <rect x="1" y="6" width="3" height="3" rx="0.5" />
            <rect x="6" y="6" width="3" height="3" rx="0.5" />
            <rect x="11" y="6" width="3" height="3" rx="0.5" />
            <rect x="1" y="11" width="3" height="3" rx="0.5" />
            <rect x="6" y="11" width="3" height="3" rx="0.5" />
            <rect x="11" y="11" width="3" height="3" rx="0.5" />
          </svg>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          maxWidth: '600px',
          backgroundColor: '#161B22',
          border: '1px solid #3A424D',
          borderRadius: '4px',
          padding: '0 8px 0 12px',
          height: '32px',
          color: '#d5dbdb',
        }}>
          <span style={{ display: 'flex', marginRight: '8px', color: '#aab7b8' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5" fill="none" />
              <path d="M10.5 10.5L14 14" fill="none" strokeWidth="2" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#f2f3f3',
              width: '100%',
              outline: 'none',
              fontSize: '14px',
              fontStyle: 'italic'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#aab7b8', fontSize: '13px' }}>[Option+S]</span>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#d5dbdb" strokeWidth="1.5" />
                <circle cx="10" cy="11" r="2.5" fill="#d5dbdb" />
                <path d="M12 13L16 17" stroke="#d5dbdb" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* Terminal */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', cursor: 'pointer', color: '#d5dbdb' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="2" width="14" height="12" rx="1.5" />
              <path d="M4 6L6.5 8.5L4 11" />
              <path d="M8.5 11H12" />
            </svg>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#3a424d' }} />
          {/* Bell */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', cursor: 'pointer', color: '#d5dbdb' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.5 11h9l-1.5-2V6a3 3 0 00-6 0v3L3.5 11z" />
              <path d="M6.5 12.5a1.5 1.5 0 003 0" />
            </svg>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#3a424d' }} />
          {/* Question mark */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', cursor: 'pointer', color: '#d5dbdb' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M6 6.5a2 2 0 013.5 1.5c0 1-1.5 1.5-1.5 2.5" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#3a424d' }} />
          {/* Settings gear */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', cursor: 'pointer', color: '#d5dbdb' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 2h3l.4 2.2a6 6 0 011.8 1l2.1-.8 1.5 2.6-1.7 1.4a6 6 0 010 2.2l1.7 1.4-1.5 2.6-2.1-.8a6 6 0 01-1.8 1L11.5 18h-3l-.4-2.2a6 6 0 01-1.8-1l-2.1.8-1.5-2.6 1.7-1.4a6 6 0 010-2.2L2.7 8l1.5-2.6 2.1.8a6 6 0 011.8-1L8.5 2z" />
              <circle cx="10" cy="10" r="2.5" />
            </svg>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#3a424d' }} />
          {/* Global */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', cursor: 'pointer', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#f2f3f3' }}>
            Global
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6L8 10L12 6H4Z" />
            </svg>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#3a424d' }} />
          {/* User Menu */}
          <div ref={userMenuRef} style={{ position: 'relative', height: '100%' }}>
            <div
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-end', 
                justifyContent: 'center',
                padding: '0 12px', 
                height: '100%', 
                cursor: 'pointer', 
                color: '#f2f3f3', 
              }}
              onClick={() => setUserMenuOpen((prev) => !prev)}
            >
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                backgroundColor: '#7D8897',
                padding: '2px 8px',
                borderRadius: '3px',
              }}>
                {isMounted ? (user?.username || 'user') : 'user'} (559655298503)
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 6L8 10L12 6H4Z" />
                </svg>
              </span>
              <span style={{ fontSize: '11px', color: '#d5dbdb' }}>{isMounted ? (user?.username || 'user') : 'user'}</span>
            </div>
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                minWidth: '200px',
                backgroundColor: '#16191f',
                border: '1px solid #3a424d',
                borderRadius: '0 0 4px 4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 1100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #3a424d', fontSize: '12px', color: '#8d9096' }}>
                  Account ID: 1234-5678-9012
                </div>
                {[
                  { label: 'Account', id: 'account' },
                  { label: 'Organization', id: 'organization' },
                  { label: 'Service Quotas', id: 'quotas' },
                  { label: 'Billing Dashboard', id: 'billing' },
                  { label: 'Security Credentials', id: 'credentials' },
                ].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      color: '#d5dbdb',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2e33')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {item.label}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #3a424d' }} />
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: '#d5dbdb',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2e33')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    window.location.href = '/login';
                  }}
                >
                  Sign out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sub-header bar — white bar with hamburger + breadcrumbs + utility icons */}
      <div id="sub-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        height: '42px',
        padding: '0 16px',
        borderBottom: '1px solid #d5dbdb',
        position: 'sticky',
        top: '40px',
        zIndex: 1001,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger — thin dark lines */}
          <div style={{ cursor: 'pointer', color: '#545b64', display: 'flex', alignItems: 'center', padding: '4px 2px' }} onClick={() => setNavOpen(!navOpen)}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </div>
          {/* Inline breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700 }}>
            {buildBreadcrumbs(pathname).map((crumb, idx, arr) => (
              <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {idx > 0 && <span style={{ color: '#687078' }}>{'>'}</span>}
                {idx === arr.length - 1 ? (
                  <span style={{ color: '#16191f', fontWeight: 700 }}>{crumb.text}</span>
                ) : (
                  <span
                    style={{ color: '#0972d3', cursor: 'pointer', textDecoration: 'none' }}
                    onClick={() => router.push(crumb.href)}
                  >
                    {crumb.text}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
        {/* Right utility icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#545b64' }}>
          {/* Window/split icon */}
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
              <line x1="8" y1="2.5" x2="8" y2="13.5" />
            </svg>
          </div>
          {/* Info circle icon */}
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="6.5" />
              <line x1="8" y1="7" x2="8" y2="11.5" />
              <circle cx="8" cy="5" r="0.6" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main app layout with sidebar */}
      <CloudscapeAppLayout
        navigation={
          <SideNavigation
            header={{
              text: 'Route 53',
              href: '/dashboard',
            }}
            activeHref={pathname}
            items={NAV_ITEMS}
            onFollow={handleNavFollow}
          />
        }
        navigationOpen={navOpen}
        onNavigationChange={({ detail }) => setNavOpen(detail.open)}
        toolsHide={true}
        content={children}
        headerSelector="#top-nav, #sub-header"
        footerSelector="#aws-footer"
      />

      {/* AWS Console Footer */}
      <footer id="aws-footer" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000716',
        color: '#8d9096',
        fontSize: '12px',
        padding: '6px 20px',
        fontFamily: '"Amazon Ember", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        borderTop: '1px solid #414750',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#d1d5db' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4L6 8L2 12M8 12H14" />
              <rect x="1" y="2" width="14" height="12" rx="2" />
            </svg>
            CloudShell
          </span>
          <span style={{ cursor: 'pointer', color: '#d1d5db' }}>Feedback</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#d1d5db' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="1" width="10" height="14" rx="2" />
              <circle cx="8" cy="12" r="1" />
            </svg>
            Console Mobile App
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
          <span style={{ cursor: 'pointer', color: '#d1d5db' }}>Privacy</span>
          <span style={{ cursor: 'pointer', color: '#d1d5db' }}>Terms</span>
          <span style={{ cursor: 'pointer', color: '#d1d5db' }}>Cookie preferences</span>
        </div>
      </footer>
    </>
  );
}
