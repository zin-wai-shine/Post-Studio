import React from 'react';
import { FiMenu, FiRotateCcw } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import './Header.css';

export function Header({
  title = 'Watermark Studio',
  subtitle = 'Apply and manage watermarks across multiple images.',
  sidebarCollapsed = false,
  onToggleSidebar,
  onResetWorkspace,
  showReset = false,
  headerActions = null
}) {
  return (
    <header className="header">
      <div className="header-left">
        {/* Sidebar Toggle Button */}
        <IconButton
          icon={<FiMenu size={18} />}
          size="md"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />

        {/* Brand Logo: Clean text "POFIX STUDIO" */}
        <span className="brand-logo-text">POFIX STUDIO</span>

        <span className="header-brand-divider" />

        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        {headerActions}
        {showReset && onResetWorkspace && !headerActions && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<FiRotateCcw size={13} />}
            onClick={onResetWorkspace}
          >
            Reset Workspace
          </Button>
        )}
      </div>
    </header>
  );
}
