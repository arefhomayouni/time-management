import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Users, CreditCard, User, LogOut, Globe } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-luxury-black/80 backdrop-blur-md border-b border-white/10 z-50 px-6 md:px-10 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-luxury-gold rounded-xl flex items-center justify-center text-luxury-black font-bold text-xl">T</div>
        <span className="text-xl font-bold tracking-tighter">TIME<span className="text-luxury-gold">LUXE</span></span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-luxury-gold transition-colors flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
        </Link>
        <Link to="/groups" className="text-sm font-medium text-gray-400 hover:text-luxury-gold transition-colors flex items-center gap-2">
          <Users className="w-4 h-4" /> {t('nav.groups')}
        </Link>
        <Link to="/payments" className="text-sm font-medium text-gray-400 hover:text-luxury-gold transition-colors flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> {t('nav.payments')}
        </Link>
        <Link to="/profile" className="text-sm font-medium text-gray-400 hover:text-//luxury-gold transition-colors flex items-center gap-2">
          <User className="w-4 h-4" /> {t('nav.profile')}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-luxury-gold transition-all flex items-center gap-2 text-xs font-bold"
        >
          <Globe className="w-4 h-4" /> {language === 'en' ? 'FA' : 'EN'}
        </button>

        <div className="hidden sm:block text-right mr-4">
          <p className="text-xs text-gray-500">{t('nav.logged_in_as')}</p>
          <p className="text-sm font-bold text-luxury-gold">{user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
