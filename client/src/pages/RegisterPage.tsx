import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    personalRate: 0,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/users/register', formData);
      const { token, data } = response.data;
      login(token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-luxury-darkGray p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">{t('auth.register_title')}</h1>
          <p className="text-gray-400">{t('auth.register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.username')}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.personalRate')}</label>
              <input
                type="number"
                value={formData.personalRate}
                onChange={(e) => setFormData({ ...formData, personalRate: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
                placeholder="25"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-goldLight transition-all duration-300 transform hover:scale-[1.02]"
          >
            {t('auth.register_btn')}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400">
          {t('auth.have_account')} <Link to="/login" className="text-luxury-gold hover:underline">{t('auth.login_link')}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
