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

  /** Walk a dotted path inside one translation file. undefined if missing. */
  const lookup = (lang: Language, path: string): any => {
    let result: any = translations[lang];
    for (const key of path.split('.')) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  const t = (path: string): string => {
    const result = lookup(language, path);
    if (typeof result === 'string') return result;
    // fall back to English before giving up
    const fallback = lookup('en', path);
    return typeof fallback === 'string' ? fallback : path;
  };

  /**
   * Array entries (howto.steps, ...) from the translation files.
   *
   * t() is typed as string and returns the path itself for any non-string
   * value, so an array path passed to t() becomes the literal string
   * "howto.steps" - calling .map() on it throws and takes the whole app
   * down. Callers that iterate a translated list must use this instead.
   */
  const tList = <T = any>(path: string): T[] => {
    const result = lookup(language, path);
    if (Array.isArray(result)) return result as T[];
    const fallback = lookup('en', path);
    return Array.isArray(fallback) ? (fallback as T[]) : [];
  };

  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return {
    t,
    tList,
    language,
    setLanguage: (lang: Language) => dispatch(setLanguage(lang)),
    isRTL: language === 'fa',
  };
}
