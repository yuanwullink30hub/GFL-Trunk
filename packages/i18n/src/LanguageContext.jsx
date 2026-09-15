import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext();

// Only a language the visitor actively picks with the NL/EN toggle is stored, so it
// survives reloads — several flows (client-mode entry, password verification)
// hard-refresh the page. Without a pick, every visit starts in the language of the
// visitor's IP country (functions/_middleware.js), or the browser language where that
// isn't available (local dev). apps/platform/index.html repeats this rule for the
// pre-React loading screen.
const STORAGE_KEY = 'gfl_language_choice';
const SUPPORTED = ['nl', 'en'];

// Earlier builds wrote this key on every visit with Dutch as the default, so a stored
// 'nl' says nothing about the visitor. Only 'en' (reachable solely via the toggle)
// is carried over; the key itself is removed.
const LEGACY_STORAGE_KEY = 'gfl_language';

function resolveBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';

  const candidates = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (typeof navigator.language === 'string') {
    candidates.push(navigator.language);
  }

  const preferred = candidates.find(Boolean)?.toLowerCase();
  if (!preferred) return 'en';

  const primary = preferred.split('-')[0];
  return primary === 'nl' ? 'nl' : 'en';
}

// Set on <html data-geo-lang> by the Cloudflare Pages middleware; absent in local dev.
function resolveGeoLanguage() {
  if (typeof document === 'undefined') return null;
  const geoLang = document.documentElement.getAttribute('data-geo-lang');
  return SUPPORTED.includes(geoLang) ? geoLang : null;
}

function readStoredLanguage() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      if (legacy === 'en' && localStorage.getItem(STORAGE_KEY) === null) {
        localStorage.setItem(STORAGE_KEY, 'en');
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(stored)) return stored;
  } catch (_) { /* private mode / storage blocked */ }

  return resolveGeoLanguage() || resolveBrowserLanguage();
}

function storeLanguageChoice(language) {
  try { localStorage.setItem(STORAGE_KEY, language); } catch (_) { /* ignore */ }
}

/**
 * LanguageProvider - Wraps the app and provides language state + translation helper
 * Default language: the visitor's toggle pick, else their IP country's language, else the browser's
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  // Keep <html lang> in sync for screen readers, browser translation prompts
  // and CSS :lang() rules.
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    storeLanguageChoice(next);
    setLanguageState(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'nl' ? 'en' : 'nl');
  }, [language, setLanguage]);

  /**
   * t(key) - Translate a dot-notation key path
   * e.g. t('assessmentIntro.title') => translations.assessmentIntro.title[language]
   * 
   * Also supports passing an object directly: t({ nl: '...', en: '...' })
   */
  const t = useCallback((key) => {
    // If key is an object with nl/en, resolve directly
    if (key && typeof key === 'object' && (key.nl !== undefined || key.en !== undefined)) {
      return key[language] || key.en || key.nl || '';
    }

    // Dot-notation path lookup
    if (typeof key === 'string') {
      const parts = key.split('.');
      let value = translations;
      for (const part of parts) {
        if (value === undefined || value === null) return key;
        value = value[part];
      }
      // If the resolved value has language keys
      if (value && typeof value === 'object' && (value[language] !== undefined)) {
        return value[language];
      }
      // If it's a direct value (string, number)
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      // Fallback: return the key itself
      return key;
    }

    return key;
  }, [language]);

  /**
   * tArray(key) - Get a translated array
   * e.g. tArray('recommendations.foundation') => ['...', '...']
   */
  const tArray = useCallback((key) => {
    if (typeof key === 'string') {
      const parts = key.split('.');
      let value = translations;
      for (const part of parts) {
        if (value === undefined || value === null) return [];
        value = value[part];
      }
      if (value && typeof value === 'object' && Array.isArray(value[language])) {
        return value[language];
      }
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  }, [language]);

  /**
   * tFunc(key) - Get a translated function (for template strings)
   * e.g. tFunc('insights.foundationalPatterns')('Zelf') => 'Your Zelf layer...'
   */
  const tFunc = useCallback((key) => {
    if (typeof key === 'string') {
      const parts = key.split('.');
      let value = translations;
      for (const part of parts) {
        if (value === undefined || value === null) return () => key;
        value = value[part];
      }
      if (value && typeof value === 'object' && typeof value[language] === 'function') {
        return value[language];
      }
    }
    return () => key;
  }, [language]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    tArray,
    tFunc
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage hook - Access language context from any component
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
