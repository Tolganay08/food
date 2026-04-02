import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, ChefHat, Truck, Shield, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

function RestaurantCard({ restaurant, t }) {
  return (
    <Link to={`/restaurant/${restaurant.id}`} className="card group overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="badge bg-white/90 backdrop-blur-sm text-ink shadow-sm">
            {restaurant.cuisine}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star size={13} className="text-accent-500 fill-accent-500" />
          <span className="text-xs font-bold">{restaurant.rating}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 group-hover:text-primary-500 transition-colors">{restaurant.name}</h3>
        <p className="text-sm text-ink/50 line-clamp-1 mb-3">{restaurant.description}</p>
        <div className="flex items-center gap-4 text-xs text-ink/50">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {restaurant.deliveryTime}
          </span>
          <span className="flex items-center gap-1">
            <Truck size={13} /> {formatPrice(restaurant.deliveryFee)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {t('common.min')} {formatPrice(restaurant.minOrder)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantAPI.getAll().then((r) => r.data),
  });

  const { data: cuisines = [] } = useQuery({
    queryKey: ['cuisines'],
    queryFn: () => restaurantAPI.getCuisines().then((r) => r.data),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const featured = restaurants.slice(0, 6);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-secondary-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-6xl text-white mb-4 leading-tight">{t('homePage.heroTitle')}</h1>
            <p className="text-lg text-white/75 mb-8 max-w-lg">{t('homePage.heroSubtitle')}</p>
            <form onSubmit={handleSearch} className="flex bg-white rounded-2xl p-1.5 shadow-xl max-w-lg">
              <div className="flex items-center flex-1 px-4 gap-3">
                <Search size={20} className="text-ink/30 shrink-0" />
                <input
                  type="text"
                  placeholder={t('homePage.searchPlaceholder')}
                  className="w-full py-3 text-ink placeholder:text-ink/40 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6 shrink-0">
                {t('common.search')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: t('homePage.fastDelivery'), desc: t('homePage.fastDeliveryDesc'), color: 'primary' },
            { icon: ChefHat, title: t('homePage.bestRestaurants'), desc: t('homePage.bestRestaurantsDesc'), color: 'secondary' },
            { icon: Shield, title: t('homePage.liveTracking'), desc: t('homePage.liveTrackingDesc'), color: 'accent' },
          ].map((item) => (
            <div key={item.title} className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center shrink-0`}>
                <item.icon size={22} className={`text-${item.color}-500`} />
              </div>
              <div>
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-ink/50">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cuisine Filters */}
      {cuisines.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
          <h2 className="font-display text-2xl mb-4">{t('homePage.browseByCuisine')}</h2>
          <div className="flex gap-2 flex-wrap">
            {cuisines.map((cuisine) => (
              <Link
                key={cuisine}
                to={`/restaurants?cuisine=${encodeURIComponent(cuisine)}`}
                className="px-5 py-2.5 bg-white rounded-full border border-ink/10 text-sm font-medium hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 transition-all"
              >
                {cuisine}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{t('homePage.popularRestaurants')}</h2>
          <Link to="/restaurants" className="flex items-center gap-1 text-primary-500 font-semibold text-sm hover:underline">
            {t('homePage.viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-44 bg-ink/5" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-ink/5 rounded w-2/3" />
                  <div className="h-4 bg-ink/5 rounded w-full" />
                  <div className="h-3 bg-ink/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
