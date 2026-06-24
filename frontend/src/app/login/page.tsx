'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@cloudscape-design/components/input';
import Alert from '@cloudscape-design/components/alert';
import api from '@/lib/api';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [userType, setUserType] = useState<'root' | 'iam'>('root');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');

  const handleNext = () => {
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleSignIn = async () => {
    setError('');
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/login', { username: username.trim(), password });
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/register', { username: username.trim(), password });
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f2f3f3',
      fontFamily: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background isometric blocks decoration */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '300px',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#d5d8e8" strokeWidth="1" strokeLinejoin="round" fill="none" opacity="0.5">
            <g transform="translate(200, 180)">
              <path d="M-80 -40 L0 -80 L80 -40 L80 40 L0 80 L-80 40 Z" />
              <path d="M-80 -40 L0 0 L80 -40 M0 0 L0 80" />
              <path d="M-60 -50 L20 -10 M-40 -60 L40 -20 M-20 -70 L60 -30" />
              <path d="M-60 -10 L-60 70 M-40 -20 L-40 60 M-20 -30 L-20 50" />
            </g>
            <g transform="translate(100, 230)">
              <path d="M-40 -20 L0 -40 L40 -20 L40 20 L0 40 L-40 20 Z" />
              <path d="M-40 -20 L0 0 L40 -20 M0 0 L0 40" />
            </g>
            <g transform="translate(350, 210)">
              <path d="M-60 -30 L0 -60 L60 -30 L60 30 L0 60 L-60 30 Z" />
              <path d="M-60 -30 L0 0 L60 -30 M0 0 L0 60" />
            </g>
            <g transform="translate(1100, 130)">
              <path d="M-90 -45 L0 -90 L90 -45 L90 45 L0 90 L-90 45 Z" />
              <path d="M-90 -45 L0 0 L90 -45 M0 0 L0 90" />
              <path d="M-67.5 -56.25 L22.5 -11.25 M-45 -67.5 L45 -22.5 M-22.5 -78.75 L67.5 -33.75" />
              <path d="M22.5 -11.25 L22.5 78.75 M45 -22.5 L45 67.5 M67.5 -33.75 L67.5 56.25" />
            </g>
            <g transform="translate(850, 190)">
              <path d="M-70 -35 L0 -70 L70 -35 L70 35 L0 70 L-70 35 Z" />
              <path d="M-70 -35 L0 0 L70 -35 M0 0 L0 70" />
            </g>
            <g transform="translate(1300, 250)">
              <path d="M-40 -20 L0 -40 L40 -20 L40 20 L0 40 L-40 20 Z" />
              <path d="M-40 -20 L0 0 L40 -20 M0 0 L0 40" />
            </g>
          </g>
        </svg>
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '24px',
        padding: '12px 24px',
        fontSize: '13px',
        color: '#545b64',
        zIndex: 1,
      }}>
        <span style={{ cursor: 'pointer' }}>Provide feedback</span>
        <span style={{ cursor: 'pointer' }}>Multi-session disabled ▾</span>
        <span style={{ cursor: 'pointer' }}>English ▾</span>
      </div>

      {/* AWS Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', zIndex: 1 }}>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 304 182"
          width="100"
          height="60"
        >
          <path
            fill="#252f3e"
            d="M86.4,66.4c0,3.7,0.4,6.7,1.1,8.9c0.8,2.2,1.8,4.6,3.2,7.2c0.5,0.8,0.7,1.6,0.7,2.3c0,1-0.6,2-1.9,3l-6.3,4.2c-0.9,0.6-1.8,0.9-2.6,0.9c-1,0-2-0.5-3-1.4C76.2,90,75,88.4,74,86.8c-1-1.7-2-3.6-3.1-5.9c-7.8,9.2-17.6,13.8-29.4,13.8c-8.4,0-15.1-2.4-20-7.2c-4.9-4.8-7.4-11.2-7.4-19.2c0-8.5,3-15.4,9.1-20.6c6.1-5.2,14.2-7.8,24.5-7.8c3.4,0,6.9,0.3,10.6,0.8c3.7,0.5,7.5,1.3,11.5,2.2v-7.3c0-7.6-1.6-12.9-4.7-16c-3.2-3.1-8.6-4.6-16.3-4.6c-3.5,0-7.1,0.4-10.8,1.3c-3.7,0.9-7.3,2-10.8,3.4c-1.6,0.7-2.8,1.1-3.5,1.3c-0.7,0.2-1.2,0.3-1.6,0.3c-1.4,0-2.1-1-2.1-3.1v-4.9c0-1.6,0.2-2.8,0.7-3.5c0.5-0.7,1.4-1.4,2.8-2.1c3.5-1.8,7.7-3.3,12.6-4.5c4.9-1.3,10.1-1.9,15.6-1.9c11.9,0,20.6,2.7,26.2,8.1c5.5,5.4,8.3,13.6,8.3,24.6V66.4z M45.8,81.6c3.3,0,6.7-0.6,10.3-1.8c3.6-1.2,6.8-3.4,9.5-6.4c1.6-1.9,2.8-4,3.4-6.4c0.6-2.4,1-5.3,1-8.7v-4.2c-2.9-0.7-6-1.3-9.2-1.7c-3.2-0.4-6.3-0.6-9.4-0.6c-6.7,0-11.6,1.3-14.9,4c-3.3,2.7-4.9,6.5-4.9,11.5c0,4.7,1.2,8.2,3.7,10.6C37.7,80.4,41.2,81.6,45.8,81.6z M126.1,92.4c-1.8,0-3-0.3-3.8-1c-0.8-0.6-1.5-2-2.1-3.9L96.7,10.2c-0.6-2-0.9-3.3-0.9-4c0-1.6,0.8-2.5,2.4-2.5h9.8c1.9,0,3.2,0.3,3.9,1c0.8,0.6,1.4,2,2,3.9l16.8,66.2l15.6-66.2c0.5-2,1.1-3.3,1.9-3.9c0.8-0.6,2.2-1,4-1h8c1.9,0,3.2,0.3,4,1c0.8,0.6,1.5,2,1.9,3.9l15.8,67l17.3-67c0.6-2,1.3-3.3,2-3.9c0.8-0.6,2.1-1,3.9-1h9.3c1.6,0,2.5,0.8,2.5,2.5c0,0.5-0.1,1-0.2,1.6c-0.1,0.6-0.3,1.4-0.7,2.5l-24.1,77.3c-0.6,2-1.3,3.3-2.1,3.9c-0.8,0.6-2.1,1-3.8,1h-8.6c-1.9,0-3.2-0.3-4-1c-0.8-0.7-1.5-2-1.9-4L156,23l-15.4,64.4c-0.5,2-1.1,3.3-1.9,4c-0.8,0.7-2.2,1-4,1H126.1z M254.6,95.1c-5.2,0-10.4-0.6-15.4-1.8c-5-1.2-8.9-2.5-11.5-4c-1.6-0.9-2.7-1.9-3.1-2.8c-0.4-0.9-0.6-1.9-0.6-2.8v-5.1c0-2.1,0.8-3.1,2.3-3.1c0.6,0,1.2,0.1,1.8,0.3c0.6,0.2,1.5,0.6,2.5,1c3.4,1.5,7.1,2.7,11,3.5c4,0.8,7.9,1.2,11.9,1.2c6.3,0,11.2-1.1,14.6-3.3c3.4-2.2,5.2-5.4,5.2-9.5c0-2.8-0.9-5.1-2.7-7c-1.8-1.9-5.2-3.6-10.1-5.2L246,52c-7.3-2.3-12.7-5.7-16-10.2c-3.3-4.4-5-9.3-5-14.5c0-4.2,0.9-7.9,2.7-11.1c1.8-3.2,4.2-6,7.2-8.2c3-2.3,6.4-4,10.4-5.2c4-1.2,8.2-1.7,12.6-1.7c2.2,0,4.5,0.1,6.7,0.4c2.3,0.3,4.4,0.7,6.5,1.1c2,0.5,3.9,1,5.7,1.6c1.8,0.6,3.2,1.2,4.2,1.8c1.4,0.8,2.4,1.6,3,2.5c0.6,0.8,0.9,1.9,0.9,3.3v4.7c0,2.1-0.8,3.2-2.3,3.2c-0.8,0-2.1-0.4-3.8-1.2c-5.7-2.6-12.1-3.9-19.2-3.9c-5.7,0-10.2,0.9-13.3,2.8c-3.1,1.9-4.7,4.8-4.7,8.9c0,2.8,1,5.2,3,7.1c2,1.9,5.7,3.8,11,5.5l14.2,4.5c7.2,2.3,12.4,5.5,15.5,9.6c3.1,4.1,4.6,8.8,4.6,14c0,4.3-0.9,8.2-2.6,11.6c-1.8,3.4-4.2,6.4-7.3,8.8c-3.1,2.5-6.8,4.3-11.1,5.6C264.4,94.4,259.7,95.1,254.6,95.1z"
          />
          <g>
            <path
              fill="#FF9900"
              d="M273.5,143.7c-32.9,24.3-80.7,37.2-121.8,37.2c-57.6,0-109.5-21.3-148.7-56.7c-3.1-2.8-0.3-6.6,3.4-4.4c42.4,24.6,94.7,39.5,148.8,39.5c36.5,0,76.6-7.6,113.5-23.2C274.2,133.6,278.9,139.7,273.5,143.7z"
            />
            <path
              fill="#FF9900"
              d="M287.2,128.1c-4.2-5.4-27.8-2.6-38.5-1.3c-3.2,0.4-3.7-2.4-0.8-4.5c18.8-13.2,49.7-9.4,53.3-5c3.6,4.5-1,35.4-18.6,50.2c-2.7,2.3-5.3,1.1-4.1-1.9C282.5,155.7,291.4,133.4,287.2,128.1z"
            />
          </g>
        </svg>
      </div>

      {/* Main content area */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px',
        zIndex: 1,
      }}>
        {/* Left: Sign In / Sign Up form */}
        <div style={{
          flex: 1,
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {mode === 'signin' ? (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#16191f', margin: '0 0 16px 0' }}>
                Sign In
              </h2>
              <p style={{ fontSize: '14px', color: '#545b64', margin: '0 0 12px 0' }}>
                Access your AWS account by user type.
              </p>

              {/* User type: not sure? link */}
              <p style={{ fontSize: '14px', color: '#16191f', margin: '0 0 8px 0' }}>
                User type <span style={{ color: '#0972d3', fontSize: '12px', cursor: 'pointer' }}>(not sure?)</span>
              </p>

              {/* Root user radio */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  border: userType === 'root' ? '2px solid #0972d3' : '1px solid #d5dbdb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: userType === 'root' ? '#f0f8ff' : '#ffffff',
                  marginBottom: '8px',
                }}
                onClick={() => setUserType('root')}
              >
                <input type="radio" name="userType" checked={userType === 'root'} onChange={() => setUserType('root')} style={{ accentColor: '#0972d3', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#16191f' }}>Root user</div>
                  <div style={{ fontSize: '12px', color: '#545b64' }}>Account owner that performs tasks requiring unrestricted access.</div>
                </div>
              </label>

              {/* IAM user radio */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  border: userType === 'iam' ? '2px solid #0972d3' : '1px solid #d5dbdb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: userType === 'iam' ? '#f0f8ff' : '#ffffff',
                  marginBottom: '20px',
                }}
                onClick={() => setUserType('iam')}
              >
                <input type="radio" name="userType" checked={userType === 'iam'} onChange={() => setUserType('iam')} style={{ accentColor: '#0972d3', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#16191f' }}>IAM user</div>
                  <div style={{ fontSize: '12px', color: '#545b64' }}>User within an account that performs daily tasks.</div>
                </div>
              </label>

              {error && (
                <div style={{ marginBottom: '12px' }}>
                  <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>
                </div>
              )}

              {step === 'email' ? (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#16191f', marginBottom: '6px' }}>
                    Username
                  </div>
                  <Input
                    value={username}
                    onChange={({ detail }) => setUsername(detail.value)}
                    placeholder="Enter your username"
                    autoFocus
                    onKeyDown={({ detail }) => { if (detail.key === 'Enter') handleNext(); }}
                  />

                  <button
                    onClick={handleNext}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: '#ff9900',
                      color: '#16191f',
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '16px',
                    }}
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#16191f', marginBottom: '6px' }}>
                    Password
                  </div>
                  <Input
                    value={password}
                    type="password"
                    onChange={({ detail }) => setPassword(detail.value)}
                    placeholder="Enter password"
                    autoFocus
                    onKeyDown={({ detail }) => { if (detail.key === 'Enter') handleSignIn(); }}
                  />

                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: '#ff9900',
                      color: '#16191f',
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      marginTop: '16px',
                    }}
                  >
                    Sign in
                  </button>

                  <div
                    style={{ fontSize: '13px', color: '#0972d3', cursor: 'pointer', marginTop: '12px' }}
                    onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                  >
                    ← Back to username
                  </div>
                </>
              )}

              {/* OR divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '24px 0',
                color: '#16191f',
                fontSize: '14px',
                fontWeight: 700,
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ebed' }} />
                <span>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ebed' }} />
              </div>

              {/* Sign up button */}
              <button
                onClick={() => { setMode('signup'); setStep('email'); setError(''); setPassword(''); }}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: '#16191f',
                  border: '1px solid #545b64',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                New to AWS? Sign up
              </button>

              {/* Legal text */}
              <p style={{ fontSize: '11px', color: '#545b64', marginTop: '20px', lineHeight: '1.5' }}>
                By continuing, you agree to <span style={{ color: '#0972d3', cursor: 'pointer' }}>AWS Customer Agreement</span> or
                other agreement for AWS services, and the <span style={{ color: '#0972d3', cursor: 'pointer' }}>Privacy Notice</span>.
                This site uses essential cookies. See our <span style={{ color: '#0972d3', cursor: 'pointer' }}>Cookie Notice</span> for
                more information.
              </p>
            </>
          ) : (
            /* Sign Up mode */
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#16191f', margin: '0 0 16px 0' }}>
                Create Account
              </h2>
              <p style={{ fontSize: '14px', color: '#545b64', margin: '0 0 20px 0' }}>
                Create your AWS account to get started.
              </p>

              {error && (
                <div style={{ marginBottom: '12px' }}>
                  <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>
                </div>
              )}

              <div style={{ fontSize: '14px', fontWeight: 700, color: '#16191f', marginBottom: '6px' }}>Username</div>
              <Input
                value={username}
                onChange={({ detail }) => setUsername(detail.value)}
                placeholder="Choose a username"
                autoFocus
              />

              <div style={{ fontSize: '14px', fontWeight: 700, color: '#16191f', marginBottom: '6px', marginTop: '16px' }}>Password</div>
              <Input
                value={password}
                type="password"
                onChange={({ detail }) => setPassword(detail.value)}
                placeholder="At least 6 characters"
                onKeyDown={({ detail }) => { if (detail.key === 'Enter') handleSignUp(); }}
              />

              <button
                onClick={handleSignUp}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#ff9900',
                  color: '#16191f',
                  border: 'none',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '20px',
                }}
              >
                Create account
              </button>

              {/* OR divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '24px 0',
                color: '#16191f',
                fontSize: '14px',
                fontWeight: 700,
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ebed' }} />
                <span>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ebed' }} />
              </div>

              <button
                onClick={() => { setMode('signin'); setStep('email'); setError(''); setPassword(''); }}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: '#16191f',
                  border: '1px solid #545b64',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Already have an account? Sign in
              </button>
            </>
          )}
        </div>

        {/* Right: Marketing panel */}
        <div style={{
          flex: 1,
          maxWidth: '380px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '360px',
          background: 'linear-gradient(135deg, #1a2332 0%, #232f3e 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px',
        }}>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: '0 0 16px 0' }}>
            AWS is how fans get closer to the world&apos;s game
          </h3>
          <p style={{ fontSize: '14px', color: '#d5dbdb', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            See how Bundesliga transforms 200M data points into AI-powered experiences that connect every fan to the game
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff9900', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Explore Now
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L15 8L8 15M1 8H15" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        fontSize: '12px',
        color: '#545b64',
        textAlign: 'center',
        paddingTop: '48px',
        paddingBottom: '24px',
        zIndex: 1,
      }}>
        © 2026 Amazon Web Services, Inc. or its affiliates. All rights reserved.
      </div>
    </div>
  );
}
