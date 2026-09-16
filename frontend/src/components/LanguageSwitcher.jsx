import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const langs = [
    { code: 'SI', label: 'සිංහල' },
    { code: 'TA', label: 'தமிழ்' },
    { code: 'EN', label: 'EN' },
  ];

  return (
    <div className="flex gap-1">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
            lang === l.code
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
