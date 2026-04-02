import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Store } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { formatPrice } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

export default function CartPage() {
  const { items, restaurantName, deliveryFee, updateQuantity, removeItem, clearCart, getSubtotal, getTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-ink/20" />
        </div>
        <h2 className="font-display text-2xl mb-2">{t('cartPage.emptyTitle')}</h2>
        <p className="text-ink/50 mb-8">{t('cartPage.emptySubtitle')}</p>
        <Link to="/restaurants" className="btn-primary">
          {t('cartPage.browseRestaurants')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ink/50 hover:text-ink mb-6 text-sm">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <h1 className="font-display text-3xl mb-2">{t('cartPage.title')}</h1>
      <div className="flex items-center gap-2 text-sm text-ink/50 mb-6">
        <Store size={15} /> {restaurantName}
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="card p-4 flex items-center gap-4">
            {item.image && (
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-primary-500 font-bold">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-ink/10 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-ink/10 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="w-8 h-8 rounded-lg text-red-400 flex items-center justify-center hover:bg-red-50 transition-colors ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <span className="font-bold w-16 text-right shrink-0">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-6 space-y-3 mb-6">
        <div className="flex justify-between text-sm text-ink/60">
          <span>{t('common.subtotal')}</span>
          <span>{formatPrice(getSubtotal())}</span>
        </div>
        <div className="flex justify-between text-sm text-ink/60">
          <span>{t('common.deliveryFee')}</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <div className="border-t border-ink/5 pt-3 flex justify-between font-bold text-lg">
          <span>{t('common.total')}</span>
          <span className="text-primary-500">{formatPrice(getTotal())}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={clearCart} className="btn-ghost text-red-500 hover:bg-red-50">
          {t('common.clearCart')}
        </button>
        <button
          onClick={() => navigate(isAuthenticated ? '/checkout' : '/login')}
          className="btn-primary flex-1"
        >
          {isAuthenticated ? t('cartPage.proceedToCheckout') : t('cartPage.signInToCheckout')}
        </button>
      </div>
    </div>
  );
}
