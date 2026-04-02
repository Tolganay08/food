import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, MessageSquare, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderAPI, reviewAPI } from '../services/api';
import {
  formatDate,
  formatPrice,
  getStatusLabel,
  ORDER_STATUS_CONFIG,
} from '../utils/helpers';
import { useLanguage } from '../i18n/LanguageContext';

function StarRating({ rating, onChange, interactive = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={interactive ? () => onChange(value) : undefined}
          className={interactive ? 'transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={18}
            className={value <= rating ? 'fill-accent-500 text-accent-500' : 'text-ink/20'}
          />
        </button>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [activeReviewOrderId, setActiveReviewOrderId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingOrderId, setSubmittingOrderId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMyOrders().then((response) => response.data),
  });

  const handleOpenReview = (orderId) => {
    setActiveReviewOrderId(orderId);
    setReviewForm({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async (order) => {
    setSubmittingOrderId(order.id);

    try {
      await reviewAPI.create({
        orderId: order.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      toast.success(t('ordersPage.reviewSubmitted'));
      setActiveReviewOrderId(null);
      setReviewForm({ rating: 5, comment: '' });

      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });

      if (order.restaurant?.id) {
        queryClient.invalidateQueries({ queryKey: ['restaurant', order.restaurant.id] });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('ordersPage.reviewSubmitFailed'));
    } finally {
      setSubmittingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="font-display text-3xl mb-6">{t('common.myOrders')}</h1>
        {[1, 2, 3].map((item) => (
          <div key={item} className="card p-5 mb-4 animate-pulse">
            <div className="h-5 bg-ink/5 rounded w-1/3 mb-3" />
            <div className="h-4 bg-ink/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-3xl mb-6">{t('common.myOrders')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="mx-auto mb-4 text-ink/20" />
          <h3 className="text-lg font-bold mb-1">{t('ordersPage.noOrdersYet')}</h3>
          <p className="text-ink/50 mb-6">{t('ordersPage.startOrdering')}</p>
          <Link to="/restaurants" className="btn-primary">
            {t('cartPage.browseRestaurants')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canReview = order.status === 'DELIVERED' && !order.review;
            const isReviewOpen = activeReviewOrderId === order.id;

            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Link
                    to={`/order/${order.id}`}
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
                  >
                    <img
                      src={
                        order.restaurant?.image ||
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'
                      }
                      alt={order.restaurant?.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/order/${order.id}`}
                        className="font-bold truncate hover:text-primary-500 transition-colors"
                      >
                        {order.restaurant?.name}
                      </Link>
                      <span className={`badge text-[10px] ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
                        {getStatusLabel(order.status, language)}
                      </span>
                    </div>
                    <p className="text-sm text-ink/50">
                      #{order.orderNumber} | {order.items?.length}{' '}
                      {order.items?.length > 1 ? t('common.items') : t('common.item')} |{' '}
                      {formatPrice(order.totalAmount + order.deliveryFee)}
                    </p>
                    <p className="text-xs text-ink/40 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>

                  <Link
                    to={`/order/${order.id}`}
                    className="shrink-0 rounded-lg p-2 text-ink/20 transition-colors hover:bg-surface hover:text-primary-500"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>

                {order.review ? (
                  <div className="mt-4 rounded-2xl bg-surface p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary-500" />
                        <span className="text-sm font-semibold">{t('ordersPage.yourReview')}</span>
                      </div>
                      <StarRating rating={order.review.rating} />
                    </div>
                    {order.review.comment ? (
                      <p className="text-sm text-ink/60">{order.review.comment}</p>
                    ) : (
                      <p className="text-sm text-ink/40">{t('ordersPage.reviewWithoutComment')}</p>
                    )}
                  </div>
                ) : null}

                {canReview && !isReviewOpen && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenReview(order.id)}
                      className="btn-secondary"
                    >
                      <MessageSquare size={16} /> {t('ordersPage.leaveReview')}
                    </button>
                  </div>
                )}

                {canReview && isReviewOpen && (
                  <div className="mt-4 rounded-2xl border border-ink/10 bg-surface p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold">{t('ordersPage.leaveReview')}</h3>
                        <p className="text-sm text-ink/50">{t('ordersPage.reviewPrompt')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveReviewOrderId(null)}
                        className="text-sm text-ink/50 hover:text-ink"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-ink/70 mb-2">
                        {t('ordersPage.yourRating')}
                      </p>
                      <StarRating
                        rating={reviewForm.rating}
                        onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))}
                        interactive
                      />
                    </div>

                    <textarea
                      className="input-field h-28 resize-none"
                      placeholder={t('ordersPage.reviewCommentPlaceholder')}
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                    />

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(order)}
                        disabled={submittingOrderId === order.id}
                        className="btn-primary"
                      >
                        <Send size={16} />
                        {submittingOrderId === order.id
                          ? t('ordersPage.submittingReview')
                          : t('ordersPage.submitReview')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
