import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Watermark } from './pages/Watermark';
import { ComingSoon } from './pages/ComingSoon';
import { FiLayers, FiLayout, FiImage, FiSettings } from 'react-icons/fi';

function AppLayout() {
  const location = useLocation();
  const resetHandlerRef = useRef(null);
  const [headerActions, setHeaderActions] = useState(null);

  const registerResetHandler = useCallback((handler) => {
    resetHandlerRef.current = handler;
  }, []);

  const handleResetWorkspace = () => {
    if (resetHandlerRef.current) {
      resetHandlerRef.current();
    }
  };

  let title = 'Watermark Studio';
  let subtitle = 'Apply and manage watermarks across multiple images.';
  let showReset = false;

  if (location.pathname === '/') {
    title = 'Dashboard';
    subtitle = 'Platform overview and available production tools.';
  } else if (location.pathname === '/watermark') {
    title = 'Watermark Studio';
    subtitle = 'Apply and manage watermarks across multiple images.';
    showReset = true;
  } else if (location.pathname === '/post-generator') {
    title = 'Post Generator';
    subtitle = 'Social media post composition tool.';
  } else if (location.pathname === '/templates') {
    title = 'Templates';
    subtitle = 'Pre-configured design templates and layout presets.';
  } else if (location.pathname === '/media') {
    title = 'Media Library';
    subtitle = 'Brand assets and local media storage.';
  } else if (location.pathname === '/settings') {
    title = 'Settings';
    subtitle = 'Application preferences and storage management.';
  }

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      onResetWorkspace={handleResetWorkspace}
      showReset={showReset}
      headerActions={location.pathname === '/watermark' ? headerActions : null}
    >
      <Outlet context={{ registerResetHandler, setHeaderActions }} />
    </DashboardLayout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/watermark" element={<Watermark />} />
          <Route
            path="/post-generator"
            element={
              <ComingSoon
                title="Post Generator"
                description="The Post Generator will provide AI and template-assisted post creation for property listings and announcements."
                icon={<FiLayers />}
              />
            }
          />
          <Route
            path="/templates"
            element={
              <ComingSoon
                title="Layout Templates"
                description="Pre-configured multi-channel layout templates for property marketing campaigns."
                icon={<FiLayout />}
              />
            }
          />
          <Route
            path="/media"
            element={
              <ComingSoon
                title="Media Library"
                description="Manage your brand assets, logo variations, and local media collections."
                icon={<FiImage />}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <ComingSoon
                title="Settings"
                description="Configure default watermark preferences, export formats, and IndexedDB local storage."
                icon={<FiSettings />}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
