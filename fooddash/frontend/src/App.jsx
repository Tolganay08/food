import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { useLanguage } from './i18n/LanguageContext';

// Layout
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourierDashboard from './pages/CourierDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const { initialize, isLoading } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink/50 font-medium">{t('common.loadingApp')}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Protected routes */}
        <Route path="/checkout" element={
          <ProtectedRoute><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/order/:id" element={
          <ProtectedRoute><OrderTrackingPage /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute><OrderHistoryPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/courier" element={
          <ProtectedRoute roles={['COURIER']}><CourierDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
