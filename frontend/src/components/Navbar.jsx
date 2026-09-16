import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container-mobile py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline text-white">
          <div className="w-8 h-8 bg-blood-500 rounded-full flex items-center justify-center text-xs font-bold">G1</div>
          <span className="font-bold text-sm hidden sm:inline">GENIUS ONE</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70 hidden sm:inline">
                {user.name || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-xs bg-blood-600 hover:bg-blood-700 rounded transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
