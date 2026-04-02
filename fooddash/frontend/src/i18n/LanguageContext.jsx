import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import translations, { DEFAULT_LANGUAGE } from './translations';

const LanguageContext = createContext(null);

const resolveValue = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj);

const interpolate = (template, params = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || DEFAULT_LANGUAGE);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const t = (key, params) => {
      const current = resolveValue(translations[language], key);
      const fallback = resolveValue(translations.en, key);
      const result = current ?? fallback ?? key;
      return typeof result === 'string' ? interpolate(result, params) : result;
    };

    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
