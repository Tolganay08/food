import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useLanguage();
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="font-display text-6xl mb-6">FoodDash</h1>
          <p className="text-xl text-white/80 leading-relaxed max-w-md">
            {t('authPage.freshFood')}
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
