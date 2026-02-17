import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../translations';

const LanguageContext = createContext();

/**
 * LanguageProvider - Wraps the app and provides language state + translation helper
 * Default language: Dutch (nl)
 */
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('nl');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'nl' ? 'en' : 'nl');
  }, []);

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
   * e.g. tFunc('insights.foundationalPatterns')('Foundation') => 'Your Foundation layer...'
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
