import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import WarehousePage from './pages/WarehousePage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import StockTransferPage from './pages/StockTransferPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import TransferDashboardPage from './pages/TransferDashboardPage';
import './index.css';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/dashboard/transfer" element={<TransferDashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/transfers" element={<StockTransferPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
