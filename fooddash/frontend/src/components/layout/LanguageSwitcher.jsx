import { LANGUAGES } from '../../i18n/translations';
import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`flex items-center rounded-full border border-ink/10 bg-white/90 backdrop-blur-sm p-1 ${
        compact ? '' : 'shadow-sm'
      }`}
      aria-label={t('common.language')}
    >
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLanguage(item.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            language === item.code
              ? 'bg-primary-500 text-white'
              : 'text-ink/50 hover:text-ink hover:bg-surface'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
