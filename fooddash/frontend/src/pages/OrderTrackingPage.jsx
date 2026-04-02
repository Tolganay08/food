import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Clock, CheckCircle2, ChefHat, Truck, Package, Navigation, User, ArrowLeft } from 'lucide-react';
import { orderAPI } from '../services/api';
import { joinOrderRoom, leaveOrderRoom, getSocket } from '../services/socket';
import { formatPrice, formatDate, ORDER_STATUS_CONFIG, getStatusLabel } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

function OrderMap({ restaurant, deliveryLat, deliveryLng, courierLat, courierLng, t }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const courierMarker = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([restaurant.latitude, restaurant.longitude], 13);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const restaurantIcon = L.divIcon({
      html: '<div style="background:#FF6B35;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">R</div>',
      iconSize: [32, 32],
      className: '',
    });
    L.marker([restaurant.latitude, restaurant.longitude], { icon: restaurantIcon })
      .addTo(map)
      .bindPopup(`<b>${restaurant.name}</b><br/>${restaurant.address}`);

    const customerIcon = L.divIcon({
      html: '<div style="background:#2EC4B6;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">C</div>',
      iconSize: [32, 32],
      className: '',
    });
    L.marker([deliveryLat, deliveryLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>${t('common.deliveryAddress')}</b>`);

    L.polyline(
      [[restaurant.latitude, restaurant.longitude], [deliveryLat, deliveryLng]],
      { color: '#FF6B35', weight: 3, dashArray: '10, 10', opacity: 0.6 }
    ).addTo(map);

    const bounds = L.latLngBounds([
      [restaurant.latitude, restaurant.longitude],
      [deliveryLat, deliveryLng],
    ]);
    map.fitBounds(bounds.pad(0.3));

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [restaurant, deliveryLat, deliveryLng, t]);

  useEffect(() => {
    if (!mapInstance.current || !courierLat || !courierLng) return;
    const L = window.L;
    const courierIcon = L.divIcon({
      html: '<div style="background:#FFD166;color:#1F2933;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite">D</div>',
      iconSize: [36, 36],
      className: '',
    });

    if (courierMarker.current) {
      courierMarker.current.setLatLng([courierLat, courierLng]);
    } else {
      courierMarker.current = L.marker([courierLat, courierLng], { icon: courierIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<b>${t('ordersPage.yourCourier')}</b>`);
    }
  }, [courierLat, courierLng, t]);

  return <div ref={mapRef} className="w-full h-72 md:h-96 rounded-2xl z-0" />;
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [courierPos, setCourierPos] = useState({ lat: null, lng: null });
  const { t, language } = useLanguage();

  const statusSteps = [
    { key: 'PENDING', icon: Clock, label: t('ordersPage.orderPlaced') },
    { key: 'ACCEPTED', icon: CheckCircle2, label: t('ordersPage.accepted') },
    { key: 'COOKING', icon: ChefHat, label: t('ordersPage.cooking') },
    { key: 'READY_FOR_PICKUP', icon: Package, label: t('ordersPage.ready') },
    { key: 'PICKED_UP', icon: Truck, label: t('ordersPage.pickedUp') },
    { key: 'ON_THE_WAY', icon: Navigation, label: t('ordersPage.onTheWay') },
    { key: 'DELIVERED', icon: CheckCircle2, label: t('ordersPage.delivered') },
  ];

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id).then((r) => r.data),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!id) return;
    joinOrderRoom(id);
    const socket = getSocket();

    if (socket) {
      socket.on('order:status:update', (data) => {
        if (data.orderId === id) queryClient.invalidateQueries(['order', id]);
      });
      socket.on('courier:location:update', (data) => {
        if (data.orderId === id) setCourierPos({ lat: data.latitude, lng: data.longitude });
      });
    }

    return () => {
      leaveOrderRoom(id);
      if (socket) {
        socket.off('order:status:update');
        socket.off('courier:location:update');
      }
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
        <div className="h-72 bg-ink/5 rounded-2xl mb-6" />
        <div className="h-8 bg-ink/5 rounded w-1/3 mb-3" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">{t('common.orderNotFound')}</h2>
        <Link to="/orders" className="btn-primary mt-4">{t('common.viewOrders')}</Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/orders" className="flex items-center gap-2 text-ink/50 hover:text-ink mb-6 text-sm">
        <ArrowLeft size={16} /> {t('common.myOrders')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">
            {t('ordersPage.orderTitle', { orderNumber: order.orderNumber })}
          </h1>
          <p className="text-sm text-ink/50">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge text-sm px-3 py-1 ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
          {getStatusLabel(order.status, language)}
        </span>
      </div>

      {order.restaurant && (
        <div className="mb-6">
          <OrderMap
            restaurant={order.restaurant}
            deliveryLat={order.deliveryLat}
            deliveryLng={order.deliveryLng}
            courierLat={courierPos.lat || order.courier?.currentLat}
            courierLng={courierPos.lng || order.courier?.currentLng}
            t={t}
          />
        </div>
      )}

      {!isCancelled && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold mb-4">{t('ordersPage.orderStatus')}</h2>
          <div className="relative">
            {statusSteps.map((step, i) => {
              const isComplete = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-8 ${isComplete ? 'bg-primary-500' : 'bg-ink/10'}`} />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCurrent ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
                    isComplete ? 'bg-primary-500 text-white' : 'bg-ink/5 text-ink/30'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className={`pb-8 ${isCurrent ? 'text-ink' : isComplete ? 'text-ink/60' : 'text-ink/30'}`}>
                    <p className={`font-semibold text-sm ${isCurrent ? 'text-primary-500' : ''}`}>{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.courier && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold mb-4">{t('ordersPage.yourCourier')}</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
              <User size={22} className="text-accent-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{order.courier.user.firstName} {order.courier.user.lastName}</p>
              <p className="text-sm text-ink/50 flex items-center gap-1">
                <Phone size={13} /> {order.courier.user.phone}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">{t('common.orderDetails')}</h2>
        <p className="text-sm text-ink/50 mb-3">{t('common.from')} {order.restaurant?.name}</p>
        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.menuItem?.name}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink/5 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-ink/60">
            <span>{t('common.deliveryFee')}</span><span>{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{t('common.total')}</span><span className="text-primary-500">{formatPrice(order.totalAmount + order.deliveryFee)}</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-primary-500" /> {t('ordersPage.deliveryAddressLabel')}
        </h2>
        <p className="text-sm text-ink/60">{order.deliveryAddress}</p>
        {order.notes && (
          <p className="text-sm text-ink/50 mt-2 italic">{t('common.note')}: {order.notes}</p>
        )}
      </div>
    </div>
  );
}
