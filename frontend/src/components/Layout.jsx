import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Menu, 
  X, 
  Box,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { useAuth } from './AuthContext';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="nav-icon" /> },
    { name: 'Products', path: '/products', icon: <Package className="nav-icon" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="nav-icon" /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart className="nav-icon" /> }
  ];

  return (
    <div className="app-container">
      {/* Mobile Header Banner */}
      <header className="mobile-header">
        <Link to="/" className="brand-section" style={{ marginBottom: 0, textDecoration: 'none' }}>
          <div className="brand-logo" style={{ width: 34, height: 34 }}>
            <Box size={18} color="#fff" />
          </div>
          <span className="brand-name" style={{ fontSize: '1.2rem' }}>ApexStock</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-icon" 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ padding: '0.45rem', border: '1px solid var(--border-glass)' }}
          >
            {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--warning)' }} /> : <Moon size={15} style={{ color: 'var(--primary)' }} />}
          </button>
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Navigation">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">
            <Box size={22} color="#fff" />
          </div>
          <span className="brand-name">ApexStock</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 0',
            borderTop: '1px solid var(--border-glass)',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.9rem',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.full_name || user.email).charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.full_name || 'Admin Account'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <button 
              onClick={logout} 
              className="btn btn-danger btn-icon" 
              title="Sign Out"
              style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>v1.0.0 Stable</span>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-icon" 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ padding: '0.45rem', border: '1px solid var(--border-glass)' }}
          >
            {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--warning)' }} /> : <Moon size={15} style={{ color: 'var(--primary)' }} />}
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-workspace">
        {children}
      </main>
    </div>
  );
};
