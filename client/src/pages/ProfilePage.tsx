import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-10 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-luxury-darkGray border border-white/10 hover:border-luxury-gold transition-all"
          >
            {t('profile.back_btn')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
            <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10 text-center">
              <div className="w-32 h-32 bg-luxury-gold rounded-full mx-auto mb-6 flex items-center justify-center text-luxury-black text-4xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold mb-1">{user?.username}</h2>
              <p className="text-gray-400 mb-6">{user?.email}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-bold uppercase">
                {user?.role}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
              <h3 className="text-xl font-bold mb-6">{t('profile.details_title')}</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-luxury-black border border-white/5">
                  <span className="text-gray-400">{t('profile.rate')}</span>
                  <span className="text-luxury-gold font-bold">${user?.personalRate || 0}/hr</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-luxury-black border border-white/5">
                  <span className="text-gray-400">{t('profile.joined')}</span>
                  <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-luxury-black border border-white/5">
                  <span className="text-gray-400">{t('profile.status')}</span>
                  <span className="text-green-400 font-medium">{t('profile.active')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
