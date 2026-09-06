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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="dashboard-main">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          onResetWorkspace={onResetWorkspace}
          showReset={showReset}
          headerActions={headerActions}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
