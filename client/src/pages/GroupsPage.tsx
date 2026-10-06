import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, UserPlus, FileText, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/api';

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', hourlyRate: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/groups/my-groups');
      setGroups(res.data.data);
    } catch (err) {
      console.error('Error fetching groups', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/groups', {
        name: newGroup.name,
        hourlyRate: Number(newGroup.hourlyRate),
      });
      setShowCreateModal(false);
      setNewGroup({ name: '', hourlyRate: '' });
      fetchGroups();
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-10 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('groups.title')}</h1>
            <p className="text-gray-400">{t('groups.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-goldLight transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> {t('groups.create_btn')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <motion.div
              key={group._id}
              whileHover={{ y: -5 }}
              className="p-6 rounded-3xl bg-luxury-darkGray border border-white/10 hover:border-luxury-gold/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-luxury-gold/10 text-luxury-gold">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  {group.manager === user?._id ? 'Manager' : 'Member'}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{group.name}</h3>
              <p className="text-gray-400 mb-6">{t('groups.hourly_rate')} <span className="text-luxury-gold font-bold">${group.hourlyRate}</span></p>
              <Link
                to={`/groups/${group._id}`}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center block font-medium transition-all flex items-center justify-center gap-2"
              >
                {t('groups.view_details')} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
          {groups.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-500 text-lg">{t('groups.no_groups')}</p>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md p-8 rounded-3xl bg-luxury-darkGray border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">{t('groups.create_btn')}</h2>
              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('groups.group_name')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all text-white"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('groups.hourly_rate')}</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all text-white"
                    value={newGroup.hourlyRate}
                    onChange={(e) => setNewGroup({...newGroup, hourlyRate: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-luxury-gold text-luxury-black font-bold hover:bg-luxury-goldLight transition-all"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
