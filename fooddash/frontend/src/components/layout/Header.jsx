import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, MapPin, LogOut, LayoutDashboard, Truck, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="font-display text-2xl text-ink hidden sm:block">FoodDash</span>
        </Link>

        {/* Location */}
        {isAuthenticated && user?.address && (
          <div className="hidden md:flex items-center gap-2 text-sm text-ink/60 bg-surface px-3 py-1.5 rounded-full">
            <MapPin size={14} className="text-primary-500" />
            <span className="truncate max-w-[200px]">{user.address}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher compact />
          </div>

          <Link to="/cart" className="relative p-2 hover:bg-surface rounded-xl transition-colors">
            <ShoppingBag size={22} className="text-ink/70" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-surface rounded-full hover:bg-ink/5 transition-colors"
              >
                <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.firstName}</span>
                <ChevronDown size={14} className={`text-ink/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-ink/5 py-2 animate-slide-down">
                  <div className="px-4 py-2 border-b border-ink/5">
                    <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-ink/50">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface transition-colors">
                    <User size={16} className="text-ink/40" /> {t('common.profile')}
                  </Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface transition-colors">
                    <ShoppingBag size={16} className="text-ink/40" /> {t('common.myOrders')}
                  </Link>
                  {user.role === 'COURIER' && (
                    <Link to="/courier" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface transition-colors">
                      <Truck size={16} className="text-ink/40" /> {t('common.courierDashboard')}
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface transition-colors">
                      <LayoutDashboard size={16} className="text-ink/40" /> {t('common.adminPanel')}
                    </Link>
                  )}
                  <div className="border-t border-ink/5 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                      <LogOut size={16} /> {t('common.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">
              {t('common.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
