import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingBag, ClipboardList, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useLanguage } from '../../i18n/LanguageContext';

export default function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { t } = useLanguage();

  const navItems = [
    { to: '/', icon: Home, label: t('common.home') },
    { to: '/restaurants', icon: Search, label: t('common.browse') },
    { to: '/cart', icon: ShoppingBag, label: t('common.cart'), badge: itemCount },
    { to: '/orders', icon: ClipboardList, label: t('common.orders'), auth: true },
    { to: isAuthenticated ? '/profile' : '/login', icon: User, label: isAuthenticated ? t('common.profile') : t('common.signIn') },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-ink/5 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label, badge, auth }) => {
          if (auth && !isAuthenticated) return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  isActive ? 'text-primary-500' : 'text-ink/40 hover:text-ink/60'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
