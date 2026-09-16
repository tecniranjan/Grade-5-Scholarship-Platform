import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
  const { registerStudent } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', grade: '5', medium: 'SI',
    parent_phone: '', password: '',
    school: '', district: '', parent_email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerStudent({ ...form, grade: parseInt(form.grade) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blood-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blood-500 to-blood-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-white font-bold text-lg">G1</span>
          </div>
          <h1 className="text-lg font-bold text-primary-900">{t('register')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-5 space-y-3">
          {error && (<div className="bg-blood-50 border border-blood-200 text-blood-700 text-xs px-3 py-2 rounded-lg">{error}</div>)}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('name')}</label>
            <input type="text" value={form.name} onChange={set('name')} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('grade')}</label>
              <select value={form.grade} onChange={set('grade')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                <option value="3">{t('grade3')}</option>
                <option value="4">{t('grade4')}</option>
                <option value="5">{t('grade5')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('medium')}</label>
              <select value={form.medium} onChange={set('medium')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                <option value="SI">{t('sinhala')}</option>
                <option value="TA">{t('tamil')}</option>
                <option value="EN">{t('english')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('parentPhone')}</label>
            <input type="tel" value={form.parent_phone} onChange={set('parent_phone')} required placeholder="07X XXXX XXX" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('password')}</label>
            <input type="password" value={form.password} onChange={set('password')} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('school')}</label>
            <input type="text" value={form.school} onChange={set('school')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('district')}</label>
            <input type="text" value={form.district} onChange={set('district')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('parentEmail')}</label>
            <input type="email" value={form.parent_email} onChange={set('parent_email')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium text-sm shadow hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50">{loading ? '...' : t('register')}</button>

          <p className="text-center text-xs text-gray-500">
            <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
