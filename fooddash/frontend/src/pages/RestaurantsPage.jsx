import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Star, Search, SlidersHorizontal, Truck, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { restaurantAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

export default function RestaurantsPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCuisine = searchParams.get('cuisine') || '';
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);
  const [sortBy, setSortBy] = useState('rating');

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantAPI.getAll().then((r) => r.data),
  });

  const { data: cuisines = [] } = useQuery({
    queryKey: ['cuisines'],
    queryFn: () => restaurantAPI.getCuisines().then((r) => r.data),
  });

  const filtered = useMemo(() => {
    let result = [...restaurants];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      );
    }

    if (selectedCuisine) {
      result = result.filter((r) => r.cuisine === selectedCuisine);
    }

    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'deliveryFee') result.sort((a, b) => a.deliveryFee - b.deliveryFee);
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [restaurants, search, selectedCuisine, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCuisine('');
    setSortBy('rating');
    setSearchParams({});
  };

  const hasFilters = search || selectedCuisine;

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-3xl mb-6">{t('restaurantsPage.title')}</h1>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            placeholder={t('restaurantsPage.searchPlaceholder')}
            className="input-field pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="rating">{t('restaurantsPage.topRated')}</option>
          <option value="deliveryFee">{t('restaurantsPage.lowestDeliveryFee')}</option>
          <option value="name">{t('restaurantsPage.aToZ')}</option>
        </select>
      </div>

      {/* Cuisine Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedCuisine('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedCuisine ? 'bg-primary-500 text-white' : 'bg-white border border-ink/10 hover:border-primary-500'
          }`}
        >
          {t('common.all')}
        </button>
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c === selectedCuisine ? '' : c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCuisine === c ? 'bg-primary-500 text-white' : 'bg-white border border-ink/10 hover:border-primary-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
          <X size={14} /> {t('common.clearFilters')}
        </button>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-44 bg-ink/5" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-ink/5 rounded w-2/3" />
                <div className="h-4 bg-ink/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <SlidersHorizontal size={48} className="mx-auto mb-4 text-ink/20" />
          <h3 className="text-lg font-bold mb-1">{t('restaurantsPage.noRestaurantsFound')}</h3>
          <p className="text-ink/50">{t('restaurantsPage.tryAdjustingFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((restaurant) => (
            <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="card group overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className="badge bg-white/90 backdrop-blur-sm text-ink shadow-sm">{restaurant.cuisine}</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Star size={13} className="text-accent-500 fill-accent-500" />
                  <span className="text-xs font-bold">{restaurant.rating}</span>
                  <span className="text-xs text-ink/40">({restaurant.reviewCount})</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary-500 transition-colors">{restaurant.name}</h3>
                <p className="text-sm text-ink/50 line-clamp-1 mb-3">{restaurant.description}</p>
                <div className="flex items-center gap-4 text-xs text-ink/50">
                  <span className="flex items-center gap-1"><Clock size={13} /> {restaurant.deliveryTime}</span>
                  <span className="flex items-center gap-1"><Truck size={13} /> {formatPrice(restaurant.deliveryFee)}</span>
                  <span className="flex items-center gap-1"><MapPin size={13} /> {t('common.min')} {formatPrice(restaurant.minOrder)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
