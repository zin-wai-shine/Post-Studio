import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiDroplet,
  FiLayers,
  FiLayout,
  FiImage,
  FiSettings,
  FiX
} from 'react-icons/fi';
import { IconButton } from '../common/IconButton';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: <FiGrid /> },
  { path: '/watermark', label: 'Watermark', icon: <FiDroplet />, activeTool: true },
  { path: '/post-generator', label: 'Post Generator', icon: <FiLayers />, badge: 'Soon' },
  { path: '/templates', label: 'Templates', icon: <FiLayout />, badge: 'Soon' },
  { path: '/media', label: 'Media Library', icon: <FiImage />, badge: 'Soon' },
  { path: '/settings', label: 'Settings', icon: <FiSettings />, badge: 'Soon' }
];

export function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-badge">PS</span>
            <span className="brand-text">POST STUDIO</span>
          </div>
          {mobileOpen && (
            <IconButton
              icon={<FiX size={18} color="#FFFFFF" />}
              size="sm"
              onClick={onCloseMobile}
              aria-label="Close menu"
            />
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>v1.0.0 Production</span>
          <span>Client-Only</span>
        </div>
      </aside>
    </>
  );
}
