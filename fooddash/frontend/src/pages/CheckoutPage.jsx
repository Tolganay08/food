import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderAPI, paymentAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

export default function CheckoutPage() {
  const { items, restaurantId, restaurantName, deliveryFee, getSubtotal, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    deliveryLat: user?.latitude || 51.5237,
    deliveryLng: user?.longitude || -0.1585,
    paymentMethod: 'CASH_ON_DELIVERY',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deliveryAddress) {
      toast.error(t('checkoutPage.pleaseEnterAddress'));
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        deliveryAddress: form.deliveryAddress,
        deliveryLat: form.deliveryLat,
        deliveryLng: form.deliveryLng,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };

      const { data: order } = await orderAPI.create(orderData);

      if (form.paymentMethod === 'ONLINE') {
        await paymentAPI.createIntent({
          orderId: order.id,
          amount: getTotal(),
        });
        toast.success(t('checkoutPage.paymentProcessed'));
      } else {
        await paymentAPI.cashPayment({ orderId: order.id, amount: getTotal() });
      }

      clearCart();
      toast.success(t('checkoutPage.orderPlaced'));
      navigate(`/order/${order.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || t('checkoutPage.failedToPlaceOrder'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ink/50 hover:text-ink mb-6 text-sm">
        <ArrowLeft size={16} /> {t('checkoutPage.backToCart')}
      </button>

      <h1 className="font-display text-3xl mb-6">{t('checkoutPage.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-primary-500" /> {t('common.deliveryAddress')}
          </h2>
          <input
            type="text"
            className="input-field"
            placeholder={t('checkoutPage.enterDeliveryAddress')}
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-ink/40">{t('common.latitude')}</label>
              <input
                type="number"
                step="any"
                className="input-field text-sm"
                value={form.deliveryLat}
                onChange={(e) => setForm({ ...form, deliveryLat: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-ink/40">{t('common.longitude')}</label>
              <input
                type="number"
                step="any"
                className="input-field text-sm"
                value={form.deliveryLng}
                onChange={(e) => setForm({ ...form, deliveryLng: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-primary-500" /> {t('common.paymentMethod')}
          </h2>
          <div className="space-y-2">
            {[
              { value: 'ONLINE', label: t('checkoutPage.payOnline'), icon: CreditCard, desc: t('checkoutPage.secureCardPayment') },
              { value: 'CASH_ON_DELIVERY', label: t('checkoutPage.cashOnDelivery'), icon: Banknote, desc: t('checkoutPage.payWhenDelivered') },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.paymentMethod === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={form.paymentMethod === opt.value}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.paymentMethod === opt.value ? 'bg-primary-500 text-white' : 'bg-surface text-ink/40'
                  }`}
                >
                  <opt.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-ink/50">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary-500" /> {t('common.orderNotes')}
          </h2>
          <textarea
            className="input-field resize-none h-24"
            placeholder={t('checkoutPage.specialInstructions')}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="card p-6">
          <h2 className="font-bold mb-4">{t('common.orderSummary')}</h2>
          <p className="text-sm text-ink/50 mb-3">{t('common.from')} {restaurantName}</p>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink/70">{item.quantity}x {item.name}</span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-ink/5 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-ink/60">
              <span>{t('common.subtotal')}</span><span>{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm text-ink/60">
              <span>{t('common.delivery')}</span><span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-ink/5">
              <span>{t('common.total')}</span><span className="text-primary-500">{formatPrice(getTotal())}</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            t('checkoutPage.placeOrderFor', { total: formatPrice(getTotal()) })
          )}
        </button>
      </form>
    </div>
  );
}
