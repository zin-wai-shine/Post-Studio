import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiDroplet, FiX } from 'react-icons/fi';
import { IconButton } from '../common/IconButton';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/watermark', label: 'Watermark', icon: <FiDroplet /> }
];

export function Sidebar({ collapsed = false, mobileOpen = false, onCloseMobile }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-inner">
          {mobileOpen && (
            <div className="sidebar-mobile-header">
              <span className="sidebar-mobile-title">MENU</span>
              <IconButton
                icon={<FiX size={18} />}
                size="sm"
                onClick={onCloseMobile}
                aria-label="Close menu"
              />
            </div>
          )}

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="sidebar-version">POFIX STUDIO</span>
            <span className="sidebar-status">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
