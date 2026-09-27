import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Watermark } from './pages/Watermark';
import { ImageRenamer } from './pages/ImageRenamer';

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
  const title = isRename ? 'Image Renamer' : 'Watermark Studio';
  const subtitle = isRename
    ? 'Quickly rename image files and download all with one click.'
    : 'Apply and manage watermarks across multiple images.';
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
          <Route path="/rename" element={<ImageRenamer />} />
          <Route path="*" element={<Navigate to="/watermark" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

