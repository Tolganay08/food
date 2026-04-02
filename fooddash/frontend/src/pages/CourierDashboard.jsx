import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Power, MapPin, Navigation, Phone, Package, Truck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { courierAPI, orderAPI } from '../services/api';
import { getSocket, sendCourierLocation } from '../services/socket';
import { formatPrice, getStatusLabel, ORDER_STATUS_CONFIG } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

const NEXT_STATUS = {
  ACCEPTED: 'COOKING',
  COOKING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'PICKED_UP',
  PICKED_UP: 'ON_THE_WAY',
  ON_THE_WAY: 'DELIVERED',
};

export default function CourierDashboard() {
  const [tab, setTab] = useState('available');
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const { data: profile } = useQuery({
    queryKey: ['courier-profile'],
    queryFn: () => courierAPI.getProfile().then((r) => r.data),
  });

  const { data: availableOrders = [] } = useQuery({
    queryKey: ['available-orders'],
    queryFn: () => courierAPI.getAvailableOrders().then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: myDeliveries = [] } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => courierAPI.getMyDeliveries().then((r) => r.data),
    refetchInterval: 5000,
  });

  const [isOnline, setIsOnline] = useState(profile?.isOnline || false);

  useEffect(() => {
    if (profile) setIsOnline(profile.isOnline);
  }, [profile]);

  useEffect(() => {
    if (!isOnline) return;
    const sendLocation = () => {
      const lat = 51.515 + (Math.random() - 0.5) * 0.01;
      const lng = -0.09 + (Math.random() - 0.5) * 0.01;
      courierAPI.updateLocation({ latitude: lat, longitude: lng }).catch(() => {});
      myDeliveries.forEach((order) => {
        sendCourierLocation({ orderId: order.id, latitude: lat, longitude: lng });
      });
    };

    sendLocation();
    const interval = setInterval(sendLocation, 5000);
    return () => clearInterval(interval);
  }, [isOnline, myDeliveries]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('order:new', () => {
      queryClient.invalidateQueries(['available-orders']);
    });
    socket.on('order:status:update', () => {
      queryClient.invalidateQueries(['my-deliveries']);
      queryClient.invalidateQueries(['available-orders']);
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status:update');
    };
  }, [queryClient]);

  const toggleOnline = async () => {
    try {
      await courierAPI.toggleAvailability(!isOnline);
      setIsOnline(!isOnline);
      toast.success(
        isOnline ? t('courierPage.youAreNowOffline') : t('courierPage.youAreNowOnline')
      );
    } catch {
      toast.error(t('courierPage.failedToUpdateStatus'));
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await courierAPI.acceptOrder(orderId);
      toast.success(t('courierPage.orderAccepted'));
      queryClient.invalidateQueries(['available-orders']);
      queryClient.invalidateQueries(['my-deliveries']);
      setTab('active');
    } catch {
      toast.error(t('courierPage.failedToAcceptOrder'));
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    try {
      await orderAPI.updateStatus(orderId, nextStatus);
      toast.success(
        t('courierPage.statusUpdatedTo', { status: getStatusLabel(nextStatus, language) })
      );
      queryClient.invalidateQueries(['my-deliveries']);
    } catch {
      toast.error(t('courierPage.failedStatusUpdate'));
    }
  };

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">{t('courierPage.title')}</h1>
          <p className="text-sm text-ink/50">
            {profile?.totalDeliveries || 0} {t('common.deliveriesCompleted')}
          </p>
        </div>
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
            isOnline
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-ink/10 text-ink/50 hover:bg-ink/20'
          }`}
        >
          <Power size={16} />
          {isOnline ? t('common.online') : t('common.offline')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-500">{myDeliveries.length}</p>
          <p className="text-xs text-ink/50">{t('common.active')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-secondary-500">{profile?.totalDeliveries || 0}</p>
          <p className="text-xs text-ink/50">{t('courierPage.total')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-accent-500">{profile?.rating || 5.0}</p>
          <p className="text-xs text-ink/50">{t('common.rating')}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
        {[
          { key: 'available', label: t('common.available'), count: availableOrders.length },
          { key: 'active', label: t('common.active'), count: myDeliveries.length },
        ].map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === tabItem.key ? 'bg-white shadow-sm text-ink' : 'text-ink/50'
            }`}
          >
            {tabItem.label} ({tabItem.count})
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="space-y-4">
          {!isOnline && (
            <div className="card p-6 text-center">
              <Power size={36} className="mx-auto mb-3 text-ink/20" />
              <p className="font-semibold">{t('courierPage.youAreOffline')}</p>
              <p className="text-sm text-ink/50">{t('courierPage.goOnlineToSeeOrders')}</p>
            </div>
          )}
          {isOnline && availableOrders.length === 0 && (
            <div className="card p-6 text-center">
              <Package size={36} className="mx-auto mb-3 text-ink/20" />
              <p className="font-semibold">{t('courierPage.noOrdersAvailable')}</p>
              <p className="text-sm text-ink/50">{t('courierPage.newOrdersAppearHere')}</p>
            </div>
          )}
          {isOnline &&
            availableOrders.map((order) => (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">#{order.orderNumber}</p>
                    <p className="text-sm text-ink/50">{order.restaurant?.name}</p>
                  </div>
                  <span className="font-bold text-primary-500">
                    {formatPrice(order.totalAmount + order.deliveryFee)}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-ink/60 mb-4">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary-500 shrink-0" />
                    <span className="truncate">
                      {t('courierPage.fromLabel')}: {order.restaurant?.address}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Navigation size={14} className="text-secondary-500 shrink-0" />
                    <span className="truncate">
                      {t('courierPage.toLabel')}: {order.deliveryAddress}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-ink/40 shrink-0" />
                    {order.customer?.firstName} {order.customer?.lastName} | {order.customer?.phone}
                  </p>
                </div>
                <button onClick={() => handleAcceptOrder(order.id)} className="btn-primary w-full">
                  {t('courierPage.acceptOrder')}
                </button>
              </div>
            ))}
        </div>
      )}

      {tab === 'active' && (
        <div className="space-y-4">
          {myDeliveries.length === 0 && (
            <div className="card p-6 text-center">
              <Truck size={36} className="mx-auto mb-3 text-ink/20" />
              <p className="font-semibold">{t('courierPage.noActiveDeliveries')}</p>
              <p className="text-sm text-ink/50">{t('courierPage.acceptToStart')}</p>
            </div>
          )}
          {myDeliveries.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">#{order.orderNumber}</p>
                  <span className={`badge text-xs ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
                    {getStatusLabel(order.status, language)}
                  </span>
                </div>
                <span className="font-bold text-primary-500">
                  {formatPrice(order.totalAmount + order.deliveryFee)}
                </span>
              </div>
              <div className="space-y-2 text-sm text-ink/60 mb-4">
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary-500 shrink-0" />
                  {order.restaurant?.name} | {order.restaurant?.address}
                </p>
                <p className="flex items-center gap-2">
                  <Navigation size={14} className="text-secondary-500 shrink-0" />
                  {order.customer?.firstName} | {order.deliveryAddress}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-ink/40 shrink-0" />
                  {order.customer?.phone}
                </p>
              </div>
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => handleUpdateStatus(order.id, order.status)}
                  className="btn-primary w-full"
                >
                  {t('courierPage.updateTo', {
                    status: getStatusLabel(NEXT_STATUS[order.status], language),
                  })}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
