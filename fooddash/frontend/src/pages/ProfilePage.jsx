import { useState } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { userAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const { t } = useLanguage();
  const roleLabel = user?.role ? t(`common.roles.${user.role}`) : '';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(form);
      updateUser(data);
      toast.success(t('profilePage.profileUpdated'));
    } catch (err) {
      toast.error(t('profilePage.failedProfileUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('profilePage.passwordMinLength'));
      return;
    }
    setSavingPass(true);
    try {
      await userAPI.changePassword(passwordForm);
      toast.success(t('profilePage.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('profilePage.failedPasswordChange'));
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-3xl mb-6">{t('profilePage.title')}</h1>

      {/* Avatar & Info */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <h2 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-ink/50">{user?.email}</p>
          <span className="badge bg-primary-50 text-primary-600 mt-1">{roleLabel}</span>
        </div>
      </div>

      {/* Edit Profile */}
      <form onSubmit={handleSaveProfile} className="card p-6 mb-6">
        <h2 className="font-bold mb-4">{t('common.editProfile')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.firstName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input type="text" className="input-field pl-10" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.lastName')}</label>
              <input type="text" className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.phone')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input type="tel" className="input-field pl-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('common.address')}</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input type="text" className="input-field pl-10" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} /> {saving ? t('common.saving') : t('common.saveChanges')}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="card p-6">
        <h2 className="font-bold mb-4">{t('common.changePassword')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('profilePage.currentPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input type="password" className="input-field pl-10" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">{t('profilePage.newPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input type="password" className="input-field pl-10" placeholder={t('profilePage.minSixChars')} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} minLength={6} required />
            </div>
          </div>
          <button type="submit" disabled={savingPass} className="btn-secondary">
            <Lock size={16} /> {savingPass ? t('common.changing') : t('common.changePassword')}
          </button>
        </div>
      </form>
    </div>
  );
}
