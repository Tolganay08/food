import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n/LanguageContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    address: '', role: 'CUSTOMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success(t('authPage.accountCreated'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || t('authPage.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="animate-fade-in">
      <div className="lg:hidden mb-8">
        <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">F</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-1">{t('authPage.createAccount')}</h2>
      <p className="text-ink/50 mb-8">{t('authPage.joinToday')}</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl mb-6">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.firstName')}</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input type="text" className="input-field pl-11" placeholder={t('authPage.firstNamePlaceholder')} value={form.firstName} onChange={update('firstName')} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.lastName')}</label>
              <input type="text" className="input-field" placeholder={t('authPage.lastNamePlaceholder')} value={form.lastName} onChange={update('lastName')} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input type="email" className="input-field pl-11" placeholder={t('authPage.emailPlaceholder')} value={form.email} onChange={update('email')} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.password')}</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input type="password" className="input-field pl-11" placeholder={t('profilePage.minSixChars')} value={form.password} onChange={update('password')} minLength={6} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('authPage.phoneOptional')}</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input type="tel" className="input-field pl-11" placeholder={t('authPage.phonePlaceholder')} value={form.phone} onChange={update('phone')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('authPage.addressOptional')}</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input type="text" className="input-field pl-11" placeholder={t('authPage.yourDeliveryAddress')} value={form.address} onChange={update('address')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('authPage.iWantTo')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'CUSTOMER', label: t('authPage.orderFood') },
              { value: 'COURIER', label: t('authPage.deliverFood') },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, role: opt.value })}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.role === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-ink/10 text-ink/50 hover:border-ink/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            t('authPage.createAccount')
          )}
        </button>
      </form>

      <p className="text-center text-sm text-ink/50 mt-6">
        {t('authPage.alreadyHaveAccount')}{' '}
        <Link to="/login" className="text-primary-500 font-semibold hover:underline">{t('common.signIn')}</Link>
      </p>
    </div>
  );
}
