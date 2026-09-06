import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Watermark } from './pages/Watermark';

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

  const title = 'Watermark Studio';
  const subtitle = 'Apply and manage watermarks across multiple images.';
  const showReset = true;

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      onResetWorkspace={handleResetWorkspace}
      showReset={showReset}
      headerActions={location.pathname === '/watermark' || location.pathname === '/' ? headerActions : null}
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
          <Route path="*" element={<Navigate to="/watermark" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

