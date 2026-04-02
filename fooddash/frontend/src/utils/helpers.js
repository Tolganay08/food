const getCurrentLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('language') || 'ru';
};

const LOCALE_MAP = {
  ru: 'ru-KZ',
  en: 'en-KZ',
  kk: 'kk-KZ',
};

const DEFAULT_USD_TO_KZT_RATE = 491.29;
const parsedExchangeRate = Number.parseFloat(import.meta.env.VITE_USD_TO_KZT_RATE);
export const USD_TO_KZT_RATE = Number.isFinite(parsedExchangeRate)
  ? parsedExchangeRate
  : DEFAULT_USD_TO_KZT_RATE;

const toNumber = (value) => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const convertUsdToKzt = (amount) => toNumber(amount) * USD_TO_KZT_RATE;

export const convertKztToUsd = (amount) => toNumber(amount) / USD_TO_KZT_RATE;

export const formatPrice = (price) => {
  return new Intl.NumberFormat(LOCALE_MAP[getCurrentLanguage()] || 'en-KZ', {
    style: 'currency',
    currency: 'KZT',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertUsdToKzt(price));
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat(LOCALE_MAP[getCurrentLanguage()] || 'en-KZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  const now = Date.now();
  const targetTime = new Date(date).getTime();
  const diffMs = targetTime - now;
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  const formatter = new Intl.RelativeTimeFormat(LOCALE_MAP[getCurrentLanguage()] || 'en-KZ', {
    numeric: 'auto',
  });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 7) return formatter.format(diffDays, 'day');
  return formatDate(date);
};

export const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: { ru: 'В ожидании', en: 'Pending', kk: 'Күтуде' },
    color: 'bg-amber-100 text-amber-800',
    step: 0,
  },
  ACCEPTED: {
    label: { ru: 'Принят', en: 'Accepted', kk: 'Қабылданды' },
    color: 'bg-blue-100 text-blue-800',
    step: 1,
  },
  COOKING: {
    label: { ru: 'Готовится', en: 'Cooking', kk: 'Дайындалуда' },
    color: 'bg-orange-100 text-orange-800',
    step: 2,
  },
  READY_FOR_PICKUP: {
    label: { ru: 'Готов', en: 'Ready', kk: 'Дайын' },
    color: 'bg-purple-100 text-purple-800',
    step: 3,
  },
  PICKED_UP: {
    label: { ru: 'Забран', en: 'Picked Up', kk: 'Алынып кетті' },
    color: 'bg-indigo-100 text-indigo-800',
    step: 4,
  },
  ON_THE_WAY: {
    label: { ru: 'В пути', en: 'On the Way', kk: 'Жолда' },
    color: 'bg-secondary-100 text-secondary-800',
    step: 5,
  },
  DELIVERED: {
    label: { ru: 'Доставлен', en: 'Delivered', kk: 'Жеткізілді' },
    color: 'bg-green-100 text-green-800',
    step: 6,
  },
  CANCELLED: {
    label: { ru: 'Отменен', en: 'Cancelled', kk: 'Бас тартылды' },
    color: 'bg-red-100 text-red-800',
    step: -1,
  },
};

export const getStatusStep = (status) => ORDER_STATUS_CONFIG[status]?.step || 0;

export const getStatusLabel = (status, language = getCurrentLanguage()) => {
  const label = ORDER_STATUS_CONFIG[status]?.label;
  if (!label) return status;
  return typeof label === 'string' ? label : label[language] || label.en || status;
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
