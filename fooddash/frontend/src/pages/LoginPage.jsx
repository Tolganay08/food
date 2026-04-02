import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form);
      toast.success(t('authPage.welcomeBackToast', { name: data.user.firstName }));
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'COURIER') navigate('/courier');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('authPage.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="lg:hidden mb-8">
        <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">F</span>
        </div>
        <h1 className="font-display text-3xl text-ink">FoodDash</h1>
      </div>

      <h2 className="text-2xl font-bold mb-1">{t('authPage.welcomeBack')}</h2>
      <p className="text-ink/50 mb-8">{t('authPage.signInSubtitle')}</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              type="email"
              className="input-field pl-11"
              placeholder={t('authPage.emailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.password')}</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pl-11 pr-11"
              placeholder={t('authPage.enterPassword')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            t('common.signIn')
          )}
        </button>
      </form>

      <p className="text-center text-sm text-ink/50 mt-6">
        {t('authPage.dontHaveAccount')}{' '}
        <Link to="/register" className="text-primary-500 font-semibold hover:underline">
          {t('common.signUp')}
        </Link>
      </p>

      <div className="mt-8 p-4 bg-surface rounded-xl">
        <p className="text-xs font-semibold text-ink/40 mb-2">{t('authPage.testAccounts')}</p>
        <div className="space-y-1 text-xs text-ink/50">
          <p>{t('authPage.testAdmin')}</p>
          <p>{t('authPage.testCustomer')}</p>
          <p>{t('authPage.testCourier')}</p>
        </div>
      </div>
    </div>
  );
}
