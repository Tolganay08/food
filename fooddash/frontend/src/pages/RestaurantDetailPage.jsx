import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Flame,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Star,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { restaurantAPI } from '../services/api';
import { formatDate, formatPrice } from '../utils/helpers';
import useCartStore from '../store/cartStore';
import { useLanguage } from '../i18n/LanguageContext';

function MenuItemCard({ item, restaurant, t }) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((cartEntry) => cartEntry.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem(item, restaurant);
    toast.success(`${item.name} ${t('restaurantDetail.addedToCart')}`, { duration: 1500 });
  };

  return (
    <div className="card p-4 flex gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold truncate">{item.name}</h4>
          {item.isPopular && (
            <span className="badge bg-primary-50 text-primary-600 shrink-0">
              <Flame size={10} className="mr-0.5" /> {t('common.popular')}
            </span>
          )}
        </div>
        <p className="text-sm text-ink/50 line-clamp-2 mb-3">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary-500">{formatPrice(item.price)}</span>
          {quantity > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-bold text-sm">{quantity}</span>
              <button
                onClick={handleAdd}
                className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      {item.image && (
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function ReviewStars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={16}
          className={value <= rating ? 'fill-accent-500 text-accent-500' : 'text-ink/20'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = `${review.user?.firstName?.[0] || ''}${review.user?.lastName?.[0] || ''}`.trim();

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary-500 text-white flex items-center justify-center font-semibold shrink-0">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={`${review.user?.firstName || ''} ${review.user?.lastName || ''}`}
              className="w-full h-full object-cover"
            />
          ) : (
            initials || 'U'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                {review.user?.firstName} {review.user?.lastName}
              </h3>
              <p className="text-xs text-ink/40">{formatDate(review.createdAt)}</p>
            </div>
            <ReviewStars rating={review.rating} />
          </div>

          {review.comment ? (
            <p className="mt-3 text-sm text-ink/60">{review.comment}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});
  const { t } = useLanguage();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantAPI.getById(id).then((response) => response.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
        <div className="h-56 bg-ink/5 rounded-2xl mb-6" />
        <div className="h-8 bg-ink/5 rounded w-1/3 mb-3" />
        <div className="h-5 bg-ink/5 rounded w-1/2" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">{t('common.restaurantNotFound')}</h2>
      </div>
    );
  }

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredCategories = (restaurant.categories || [])
    .map((category) => ({
      ...category,
      menuItems: category.menuItems.filter(
        (item) =>
          !search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((category) => category.menuItems.length > 0);

  return (
    <div className="page-enter">
      <div className="relative h-48 md:h-64 bg-ink/5">
        <img
          src={
            restaurant.coverImage ||
            restaurant.image ||
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'
          }
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="-mt-12 relative z-10 mb-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <img
                src={
                  restaurant.image ||
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'
                }
                alt={restaurant.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0 -mt-10 border-4 border-white shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl md:text-3xl mb-1">{restaurant.name}</h1>
                <p className="text-ink/50 text-sm mb-3">{restaurant.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60">
                  <span className="flex items-center gap-1">
                    <Star size={15} className="text-accent-500 fill-accent-500" />
                    <span className="font-bold text-ink">{restaurant.rating}</span>
                    <span>({restaurant.reviewCount} {t('common.reviews')})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={15} /> {restaurant.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck size={15} /> {formatPrice(restaurant.deliveryFee)} {t('common.delivery')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={15} /> {restaurant.address}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            placeholder={t('restaurantDetail.searchMenu')}
            className="input-field pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex gap-8">
          <div className="hidden md:block w-48 shrink-0">
            <div className="sticky top-20 space-y-1">
              <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">
                {t('common.menu')}
              </p>
              {restaurant.categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => scrollToCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-ink/60 hover:bg-surface'
                  }`}
                >
                  {category.name}
                  <span className="ml-1 text-ink/30">({category.menuItems.length})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-8 mb-12">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  ref={(element) => {
                    categoryRefs.current[category.id] = element;
                  }}
                >
                  <h2 className="font-display text-xl mb-4 sticky top-16 bg-surface py-2 z-10">
                    {category.name}
                  </h2>
                  <div className="space-y-3">
                    {category.menuItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} restaurant={restaurant} t={t} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center">
                <h2 className="font-semibold mb-2">{t('restaurantDetail.menuEmptyTitle')}</h2>
                <p className="text-sm text-ink/50">{t('restaurantDetail.menuEmptyDescription')}</p>
              </div>
            )}
          </div>
        </div>

        <section className="mb-12">
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={18} className="text-primary-500" />
                  <h2 className="font-display text-2xl">{t('restaurantDetail.guestReviewsTitle')}</h2>
                </div>
                <p className="text-sm text-ink/50">{t('restaurantDetail.guestReviewsSubtitle')}</p>
              </div>

              <div className="rounded-2xl bg-primary-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Star size={18} className="fill-accent-500 text-accent-500" />
                  <span className="text-xl font-bold">{restaurant.rating}</span>
                </div>
                <p className="text-xs text-ink/50 mt-1">
                  {restaurant.reviewCount} {t('common.reviews')}
                </p>
              </div>
            </div>

            {restaurant.reviews?.length > 0 ? (
              <div className="space-y-4">
                {restaurant.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/10 p-8 text-center">
                <p className="font-semibold">{t('restaurantDetail.noReviewsTitle')}</p>
                <p className="text-sm text-ink/50 mt-2">{t('restaurantDetail.noReviewsDescription')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
