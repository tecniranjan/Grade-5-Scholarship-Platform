import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('genius_lang') || 'SI';
  });

  useEffect(() => {
    localStorage.setItem('genius_lang', lang);
    document.title = translations[lang]?.appTitle || translations.EN.appTitle;
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations.EN[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
