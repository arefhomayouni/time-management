import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage, Language } from '../store/slices/uiSlice';
import en from '../translations/en.json';
import fa from '../translations/fa.json';

const translations: Record<Language, any> = { en, fa };

/**
 * Redux-backed i18n hook (replaces the old LanguageContext).
 * Returns t(path), language, setLanguage and isRTL.
 * Missing keys fall back to English, then to the key itself - never a blank UI.
 */
export function useLanguage() {
  const language = useAppSelector((s) => s.ui.language);
  const dispatch = useAppDispatch();

  const t = (path: string): string => {
    const keys = path.split('.');
    let result: any = translations[language];
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        // fall back to English before giving up
        let fallback: any = translations.en;
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            fallback = fallback[k];
          } else {
            return path;
          }
        }
        return typeof fallback === 'string' ? fallback : path;
      }
    }
    return typeof result === 'string' ? result : path;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return {
    t,
    language,
    setLanguage: (lang: Language) => dispatch(setLanguage(lang)),
    isRTL: language === 'fa',
  };
}
