import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const plans = [
  { gradeKey: 'grade3', price: '300', grade: 3 },
  { gradeKey: 'grade4', price: '400', grade: 4 },
  { gradeKey: 'grade5', price: '500', grade: 5, featured: true },
];

export default function LandingPage() {
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="bg-[#1a237e] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">GENIUS ONE</span>
            <span className="hidden sm:inline text-xs text-white/60">|</span>
            <span className="hidden sm:inline text-xs text-white/60">{t('appTitle')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="text-sm px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#1a237e] text-white pb-16 pt-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug mb-4">
            {t('landingHero')}
          </h1>
          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {t('landingSub')}
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 rounded-lg bg-[#ffd700] text-[#1a237e] font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
          >
            {t('register')}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-[#1a237e] mb-10">
            {t('howItWorks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-[#1a237e] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <p className="text-gray-700 font-medium">
                  {t(`step${step}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-[#1a237e] mb-10">
            {t('monthlyPlans')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((p) => (
              <div
                key={p.grade}
                className={`rounded-xl p-6 text-center border-2 transition-shadow ${
                  p.featured
                    ? 'border-[#ffd700] shadow-lg bg-[#fffde7]'
                    : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                {p.featured && (
                  <span className="inline-block mb-3 text-xs font-bold uppercase tracking-wider text-[#1a237e] bg-[#ffd700] px-3 py-1 rounded-full">
                    {t('popular')}
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#1a237e] mb-2">{t(p.gradeKey)}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-[#1a237e]">Rs.{p.price}</span>
                  <span className="text-gray-500 text-sm">/{t('month')}</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>✓ {t('featureExam')}</li>
                  <li>✓ {t('featureReport')}</li>
                  <li>✓ {t('featureNipunatha')}</li>
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
                    p.featured
                      ? 'bg-[#1a237e] text-white hover:bg-[#283593]'
                      : 'bg-gray-100 text-[#1a237e] hover:bg-gray-200'
                  }`}
                >
                  {t('register')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a237e] text-white/60 text-center py-6 text-xs">
        © {new Date().getFullYear()} GENIUS ONE — Qualification Evaluation UK Ltd
      </footer>
    </div>
  );
}
