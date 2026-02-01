import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PartsPage } from './pages/PartsPage';
import { InventoryPage } from './pages/InventoryPage';
import { RequestsPage } from './pages/RequestsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ScanPage } from './pages/ScanPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/parts" replace /> : <LoginPage />} />
      <Route path="/parts" element={<ProtectedRoute><PartsPage /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/parts" replace />} />
      <Route path="*" element={<Navigate to="/parts" replace />} />
    </Routes>
  );
}

export default App;
