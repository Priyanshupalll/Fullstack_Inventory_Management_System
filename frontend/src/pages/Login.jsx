import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/Notification';
import { 
  Box, 
  Mail, 
  Lock, 
  User, 
  Chrome, 
  ArrowRight,
  Info,
  Laptop
} from 'lucide-react';

export const Login = () => {
  const { login, register, googleLogin } = useAuth();
  const showNotification = useNotification();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSimulatedAccounts, setShowSimulatedAccounts] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('admin@enterprise.com');
  const [password, setPassword] = useState('adminpassword');
  const [fullName, setFullName] = useState('');

  const VITE_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // 1. Proactively inject Google Sign-In SDK
    const id = 'google-gsi-client';
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = id;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initButton = () => {
      if (window.google?.accounts?.id && VITE_GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: VITE_GOOGLE_CLIENT_ID,
            callback: (res) => handleGoogleAuth(res.credential),
          });
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-real"),
            { 
              theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_blue', 
              size: "large", 
              width: 320 
            }
          );
        } catch (e) {
          console.warn("Failed to initialize real Google login button:", e);
        }
      }
    };

    script.onload = initButton;
    if (window.google?.accounts?.id) {
      initButton();
    }
  }, [VITE_GOOGLE_CLIENT_ID, isRegister]);

  const handleGoogleAuth = async (credential) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      showNotification('Google Sign-In completed successfully!', 'success');
      navigate('/');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedGoogleLogin = async (mockProfile) => {
    setLoading(true);
    try {
      // Simulate ID Token by formatting profile payload as JSON directly
      await googleLogin(JSON.stringify(mockProfile));
      showNotification(`Signed in with Google developer account: ${mockProfile.name}`, 'success');
      navigate('/');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showNotification('Please fill in all credentials.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (password.length < 6) {
          showNotification('Password must be at least 6 characters.', 'error');
          return;
        }
        await register(email.trim(), password, fullName.trim());
        showNotification('Registration completed! Welcome to ApexStock.', 'success');
      } else {
        await login(email.trim(), password);
        showNotification('Signed in successfully.', 'success');
      }
      navigate('/');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const mockUsers = [
    {
      email: "alexander@enterprise.com",
      name: "Alexander Vance",
      google_id: "google_dev_1001",
      picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      email: "evelyn@sterling.com",
      name: "Evelyn Sterling",
      google_id: "google_dev_1002",
      picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
  ];

  return (
    <div className="flex-center" style={{ 
      minHeight: '100vh', 
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      backgroundColor: 'var(--bg-base)',
      padding: '1.5rem',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '460px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Brand Logo Banner */}
        <div className="flex-center" style={{ flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
          <div className="brand-logo" style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)' }}>
            <Box size={28} color="#fff" />
          </div>
          <div>
            <h1 className="brand-name" style={{ fontSize: '1.8rem', fontWeight: 900 }}>ApexStock</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {isRegister ? 'Register your catalogue administrator account.' : 'Sign in to access your inventory ecosystem.'}
            </p>
          </div>
        </div>

        {/* Sliding Tab Controller for Sign In vs Sign Up */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
          position: 'relative'
        }}>
          <button 
            type="button"
            onClick={() => {
              setIsRegister(false);
              setShowSimulatedAccounts(false);
              setEmail('admin@enterprise.com');
              setPassword('adminpassword');
            }}
            className="btn"
            style={{
              flex: 1,
              padding: '0.55rem',
              backgroundColor: !isRegister ? 'var(--bg-card)' : 'transparent',
              color: !isRegister ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
              fontSize: '0.85rem'
            }}
          >
            Sign In Portal
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsRegister(true);
              setShowSimulatedAccounts(false);
              setEmail('');
              setPassword('');
              setFullName('');
            }}
            className="btn"
            style={{
              flex: 1,
              padding: '0.55rem',
              backgroundColor: isRegister ? 'var(--bg-card)' : 'transparent',
              color: isRegister ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
              fontSize: '0.85rem'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Evelyn Sterling"
                  style={{ paddingLeft: '2.75rem', width: '100%' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                className="form-control"
                placeholder="e.g. administrator@enterprise.com"
                required
                style={{ paddingLeft: '2.75rem', width: '100%' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                style={{ paddingLeft: '2.75rem', width: '100%' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--border-glass)' }} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>Or Continue With</span>
          <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--border-glass)' }} />
        </div>

        {/* Google Authentication Section */}
        <div className="flex-center" style={{ flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {VITE_GOOGLE_CLIENT_ID ? (
            <div id="google-signin-real" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
          ) : (
            <button 
              onClick={() => setShowSimulatedAccounts(!showSimulatedAccounts)}
              className="btn btn-secondary" 
              style={{ width: '100%', gap: '0.75rem', border: '1px solid var(--border-glass)' }}
              type="button"
            >
              <Chrome size={18} style={{ color: '#ea4335' }} />
              <span>Sign in with Google</span>
            </button>
          )}

          {/* Sandbox Developer Mock Google Accounts Picker */}
          {showSimulatedAccounts && !VITE_GOOGLE_CLIENT_ID && (
            <div className="glass-card" style={{ 
              width: '100%', 
              backgroundColor: 'rgba(255, 255, 255, 0.01)', 
              borderColor: 'rgba(99, 102, 241, 0.15)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: 'none'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.25' }}>
                  <strong>Developer Sandbox:</strong> Google OAuth credentials are not set. Pick a simulated profile to register instantly.
                </p>
              </div>
              {mockUsers.map((profile) => (
                <button
                  key={profile.email}
                  onClick={() => handleSimulatedGoogleLogin(profile)}
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    padding: '0.5rem 1rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)'
                  }}
                  type="button"
                >
                  <img 
                    src={profile.picture} 
                    alt={profile.name} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div style={{ textAlign: 'left', marginLeft: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{profile.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{profile.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {isRegister ? 
            'Registering grants immediate access to the full inventory suite.' : 
            'Authorized access only. All transaction logs are recorded.'}
        </p>
      </div>
    </div>
  );
};
