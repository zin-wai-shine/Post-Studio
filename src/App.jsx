import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Watermark } from './pages/Watermark';
import { ImageRenamer } from './pages/ImageRenamer';
import { Presets } from './pages/Presets';

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

  const isRename = location.pathname.startsWith('/rename');
  const isPresets = location.pathname.startsWith('/presets');

  let title = 'Watermark Studio';
  let subtitle = 'Apply and manage watermarks across multiple images.';

  if (isRename) {
    title = 'Image Renamer';
    subtitle = 'Quickly rename image files and download all with one click.';
  } else if (isPresets) {
    title = 'Ready Presets Studio';
    subtitle = 'Save preset styles, compare side-by-side, and batch export with custom prefix.';
  }

  const showReset = true;

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      onResetWorkspace={handleResetWorkspace}
      showReset={showReset}
      headerActions={headerActions}
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
          <Route path="/" element={<Navigate to="/watermark" replace />} />
          <Route path="/watermark" element={<Watermark />} />
          <Route path="/presets" element={<Presets />} />
          <Route path="/rename" element={<ImageRenamer />} />
          <Route path="*" element={<Navigate to="/watermark" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

