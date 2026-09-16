import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { loginStudent, loginAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState('student');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'student') {
        await loginStudent(parentPhone, password, grade ? parseInt(grade) : undefined);
        navigate('/dashboard');
      } else {
        await loginAdmin(username, password);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blood-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blood-500 to-blood-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-xl">G1</span>
          </div>
          <h1 className="text-xl font-bold text-primary-900">{t('appTitle')}</h1>
          <p className="text-xs text-gray-500 mt-1">{t('tagline')}</p>
        </div>

        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button onClick={() => { setMode('student'); setError(''); }} className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${mode === 'student' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}>{t('studentLogin')}</button>
          <button onClick={() => { setMode('admin'); setError(''); }} className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${mode === 'admin' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}>{t('adminLogin')}</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-5 space-y-4">
          {error && (<div className="bg-blood-50 border border-blood-200 text-blood-700 text-xs px-3 py-2 rounded-lg">{error}</div>)}

          {mode === 'student' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('parentPhone')}</label>
                <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" placeholder="07X XXXX XXX" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('grade')}</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none bg-white">
                  <option value="">Any</option>
                  <option value="3">{t('grade3')}</option>
                  <option value="4">{t('grade4')}</option>
                  <option value="5">{t('grade5')}</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('username')}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" required />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" required />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium text-sm shadow hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50">{loading ? '...' : t('login')}</button>

          {mode === 'student' && (
            <p className="text-center text-xs text-gray-500">
              <Link to="/register" className="text-primary-600 font-medium hover:underline">{t('register')}</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
