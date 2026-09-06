import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './DashboardLayout.css';

export function DashboardLayout({
  children,
  title,
  subtitle,
  onResetWorkspace,
  showReset = false,
  headerActions = null
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pofix_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('pofix_sidebar_collapsed', String(next));
        } catch (e) {
          console.warn('Failed to save sidebar state:', e);
        }
        return next;
      });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Full-Width Top Navigation Bar */}
      <Header
        title={title}
        subtitle={subtitle}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onResetWorkspace={onResetWorkspace}
        showReset={showReset}
        headerActions={headerActions}
      />

      {/* Main Body Area: Sidebar on left under navbar, Workspace on right */}
      <div className="dashboard-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
