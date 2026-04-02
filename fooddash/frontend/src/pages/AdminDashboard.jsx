import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Clock,
  Edit,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI, courierAPI, orderAPI } from '../services/api';
import {
  formatDate,
  formatPrice,
  getStatusLabel,
  ORDER_STATUS_CONFIG,
} from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';
import RestaurantEditor from '../components/admin/RestaurantEditor';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon size={20} className={`text-${color}-500`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
      {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
    </div>
  );
}

function OrdersTab({ t, language }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () =>
      adminAPI.getOrders({ status: statusFilter || undefined }).then((response) => response.data),
  });

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success(t('adminPage.orderStatusUpdated'));
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch {
      toast.error(t('adminPage.failedOrderStatusUpdate'));
    }
  };

  const orders = data?.orders || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            !statusFilter ? 'bg-primary-500 text-white' : 'bg-surface'
          }`}
        >
          {t('common.all')}
        </button>
        {Object.keys(ORDER_STATUS_CONFIG).map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              statusFilter === key ? 'bg-primary-500 text-white' : 'bg-surface'
            }`}
          >
            {getStatusLabel(key, language)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((item) => <div key={item} className="card p-4 h-20 animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-ink/40">
            <Package size={40} className="mx-auto mb-3" />
            <p>{t('common.noOrdersFound')}</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">#{order.orderNumber}</span>
                  <span className={`badge text-[10px] ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
                    {getStatusLabel(order.status, language)}
                  </span>
                </div>
                <span className="font-bold text-primary-500">
                  {formatPrice(order.totalAmount + order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-ink/50">
                <div>
                  <p>
                    {order.customer?.firstName} {order.customer?.lastName} | {order.restaurant?.name}
                  </p>
                  <p className="text-xs">{formatDate(order.createdAt)}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(event) => handleStatusChange(order.id, event.target.value)}
                  className="text-xs bg-surface rounded-lg px-2 py-1 border border-ink/10"
                >
                  {Object.keys(ORDER_STATUS_CONFIG).map((key) => (
                    <option key={key} value={key}>
                      {getStatusLabel(key, language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RestaurantsTab({ t }) {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loadingEditor, setLoadingEditor] = useState(false);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => adminAPI.getRestaurants().then((response) => response.data),
  });

  const closeEditor = () => {
    setShowEditor(false);
    setSelectedRestaurant(null);
    setLoadingEditor(false);
  };

  const handleCreate = () => {
    setSelectedRestaurant(null);
    setShowEditor(true);
  };

  const handleEdit = async (restaurantId) => {
    setLoadingEditor(true);
    setShowEditor(true);

    try {
      const { data } = await adminAPI.getRestaurantById(restaurantId);
      setSelectedRestaurant(data);
    } catch (error) {
      toast.error(error.response?.data?.error || t('adminPage.failedLoadRestaurant'));
      closeEditor();
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleSaved = (restaurant) => {
    queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    queryClient.invalidateQueries({ queryKey: ['cuisines'] });

    if (restaurant?.id) {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] });
    }

    closeEditor();
  };

  const handleDelete = async (restaurantId) => {
    if (!confirm(t('common.confirmDeactivateRestaurant'))) return;

    try {
      await adminAPI.deleteRestaurant(restaurantId);
      toast.success(t('adminPage.restaurantDeactivated'));
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['cuisines'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
    } catch (error) {
      toast.error(error.response?.data?.error || t('adminPage.failedDeactivateRestaurant'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-ink/50">
          {t('adminPage.totalRestaurants', { count: restaurants.length })}
        </p>
        <button onClick={handleCreate} className="btn-primary text-sm py-2 px-4">
          <Plus size={16} />
          {t('adminPage.addRestaurantButton')}
        </button>
      </div>

      {showEditor && (
        <div className="mb-6">
          {loadingEditor ? (
            <div className="card p-6">
              <div className="h-6 w-48 animate-pulse rounded bg-ink/5 mb-4" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
                <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
                <div className="h-12 animate-pulse rounded-xl bg-ink/5 md:col-span-2" />
                <div className="h-28 animate-pulse rounded-xl bg-ink/5 md:col-span-2" />
              </div>
            </div>
          ) : (
            <RestaurantEditor
              restaurant={selectedRestaurant}
              onCancel={closeEditor}
              onSaved={handleSaved}
              t={t}
            />
          )}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((item) => <div key={item} className="card h-24 animate-pulse" />)
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant.id} className="card p-4 flex items-center gap-4">
              <img
                src={
                  restaurant.image ||
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'
                }
                alt={restaurant.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold truncate">{restaurant.name}</h3>
                  <span
                    className={`badge ${
                      restaurant.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-ink/5 text-ink/50'
                    }`}
                  >
                    {restaurant.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <p className="text-xs text-ink/50">
                  {restaurant.cuisine || t('adminPage.noCuisineLabel')} | {restaurant.address}
                </p>
                <p className="text-xs text-ink/40 mt-1">
                  {restaurant._count?.categories || 0} {t('common.categories')} |{' '}
                  {restaurant._count?.menuItems || 0} {t('common.items')} |{' '}
                  {restaurant.reviewCount || 0} {t('common.reviews')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(restaurant.id)}
                  className="p-2 hover:bg-surface rounded-lg"
                >
                  <Edit size={16} className="text-ink/40" />
                </button>
                <button
                  onClick={() => handleDelete(restaurant.id)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CouriersTab({ t }) {
  const { data: couriers = [] } = useQuery({
    queryKey: ['couriers'],
    queryFn: () => courierAPI.getAll().then((response) => response.data),
  });

  return (
    <div className="space-y-3">
      {couriers.map((courier) => (
        <div key={courier.id} className="card p-4 flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              courier.isOnline ? 'bg-green-100' : 'bg-ink/5'
            }`}
          >
            <Truck size={18} className={courier.isOnline ? 'text-green-500' : 'text-ink/30'} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {courier.user?.firstName} {courier.user?.lastName}
            </p>
            <p className="text-xs text-ink/50">
              {courier.user?.phone} | {courier.vehicleType} | {courier.totalDeliveries}{' '}
              {t('common.deliveriesWord')}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`badge ${
                courier.isOnline ? 'bg-green-100 text-green-700' : 'bg-ink/5 text-ink/40'
              }`}
            >
              {courier.isOnline ? t('common.online') : t('common.offline')}
            </span>
            <p className="text-xs text-ink/40 mt-1">
              {t('common.rating')}: {courier.rating}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { t, language } = useLanguage();

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.getAnalytics().then((response) => response.data),
    refetchInterval: 30000,
  });

  const tabs = [
    { key: 'overview', label: t('common.overview'), icon: LayoutDashboard },
    { key: 'orders', label: t('common.orders'), icon: ShoppingBag },
    { key: 'restaurants', label: t('common.restaurants'), icon: Store },
    { key: 'couriers', label: t('common.couriers'), icon: Truck },
  ];

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-3xl mb-6">{t('adminPage.title')}</h1>

      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === tabItem.key ? 'bg-white shadow-sm text-ink' : 'text-ink/50'
            }`}
          >
            <tabItem.icon size={16} /> {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={ShoppingBag}
              label={t('common.totalOrders')}
              value={analytics?.totalOrders || 0}
              color="primary"
              sub={`${analytics?.todayOrders || 0} ${t('common.today')}`}
            />
            <StatCard
              icon={Banknote}
              label={t('common.totalRevenue')}
              value={formatPrice(analytics?.totalRevenue || 0)}
              color="green"
              sub={`${formatPrice(analytics?.todayRevenue || 0)} ${t('common.today')}`}
            />
            <StatCard
              icon={Users}
              label={t('common.totalCustomers')}
              value={analytics?.totalCustomers || 0}
              color="secondary"
            />
            <StatCard
              icon={Truck}
              label={t('common.totalCouriers')}
              value={`${analytics?.onlineCouriers || 0}/${analytics?.totalCouriers || 0}`}
              color="accent"
              sub={t('adminPage.onlineSub')}
            />
          </div>

          <div className="card p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" /> {t('common.popularDishes')}
            </h2>
            <div className="space-y-3">
              {(analytics?.popularDishes || []).map((dish, index) => (
                <div key={dish?.id || index} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {dish?.image && (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{dish?.name}</p>
                    <p className="text-xs text-ink/50">{dish?.restaurant?.name}</p>
                  </div>
                  <span className="text-sm font-bold text-ink/60">
                    {dish?.totalOrdered} {t('common.ordersWord')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-secondary-500" /> {t('common.recentOrders')}
            </h2>
            <div className="space-y-3">
              {(analytics?.recentOrders || []).map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`badge text-[10px] ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
                      {getStatusLabel(order.status, language)}
                    </span>
                    <span className="font-medium">#{order.orderNumber}</span>
                    <span className="text-ink/40">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-ink/50">{order.restaurant?.name}</span>
                    <span className="font-bold">
                      {formatPrice(order.totalAmount + order.deliveryFee)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && <OrdersTab t={t} language={language} />}
      {tab === 'restaurants' && <RestaurantsTab t={t} />}
      {tab === 'couriers' && <CouriersTab t={t} />}
    </div>
  );
}
