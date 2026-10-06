import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, FileText, ChevronLeft, DollarSign, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/api';

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [reportQuery, setReportQuery] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const groupRes = await apiClient.get(`/groups/${id}`);
      setGroup(groupRes.data.data);

      const membersRes = await apiClient.get(`/groups/${id}/members`);
      setMembers(membersRes.data.data.members);
    } catch (err) {
      console.error('Error fetching group data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/groups/invite', { email: inviteEmail, groupId: id });
      setInviteEmail('');
      alert('Invitation sent successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    }
  };

  const fetchReport = async () => {
    try {
      const res = await apiClient.get(`/groups/${id}/report?month=${reportQuery.month}&year=${reportQuery.year}`);
      setReport(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-luxury-black text-luxury-gold">{t('common.loading')} Group...</div>;
  if (!group) return <div className="h-screen w-full flex items-center justify-center bg-luxury-black text-white">Group not found.</div>;

  const isManager = group.manager === user?._id;

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-10 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => window.history.back()} className="p-2 rounded-full bg-luxury-darkGray hover:bg-white/10 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold">{group.name}</h1>
          <div className="ml-auto px-4 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-sm font-bold">
            ${group.hourlyRate}/hr
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Members & Management */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-luxury-gold" /> {t('groups.members_title')}
              </h2>
              <div className="space-y-4">
                {members.map((m: any) => (
                  <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-luxury-black border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-luxury-gold/20 text-luxury-gold flex items-center justify-center text-xs font-bold">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{m.username}</span>
                    </div>
                    {m._id === group.manager && (
                      <span className="text-[10px] uppercase font-bold text-gray-500">Manager</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isManager && (
              <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-//luxury-gold" /> {t('groups.invite_title')}
                </h2>
                <form onSubmit={handleInvite} className="space-y-4">
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all text-white"
                    placeholder="member@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full py-3 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-goldLight transition-all">
                    {t('groups.invite_btn')}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Report Section */}
          <div className="lg:col-span-2">
            <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-luxury-gold" /> {t('groups.report_title')}
                </h2>
                <div className="flex gap-3">
                  <input
                    type="number"
                    className="w-20 px-3 py-2 bg-luxury-black border border-white/10 rounded-lg outline-none focus:border-luxury-gold"
                    value={reportQuery.month}
                    onChange={(e) => setReportQuery({...reportQuery, month: Number(e.target.value)})}
                  />
                  <input
                    type="number"
                    className="w-24 px-3 py-2 bg-luxury-black border border-white/10 rounded-lg outline-none focus:border-luxury-gold"
                    value={reportQuery.year}
                    onChange={(e) => setReportQuery({...reportQuery, year: Number(e.target.value)})}
                  />
                  <button
                    onClick={fetchReport}
                    className="px-4 py-2 bg-luxury-gold text-luxury-black font-bold rounded-lg hover:bg-luxury-goldLight transition-all"
                  >
                    {t('common.load')}
                  </button>
                </div>
              </div>

              {!report ? (
                <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Select month/year and click Load to see the report.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-sm border-b border-white/10">
                      <tr>
                        <th className="pb-4 font-medium">{t('groups.report_table_member')}</th>
                        <th className="pb-4 font-medium">{t('groups.report_table_hours')}</th>
                        <th className="pb-4 font-medium">{t('groups.report_table_owed')}</th>
                        <th className="pb-4 font-medium">{t('groups.report_table_paid')}</th>
                        <th className="pb-4 font-medium">{t('groups.report_table_status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.reports.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 font-medium">{r.username}</td>
                          <td className="py-4">{r.totalHours}h</td>
                          <td className="py-4 text-luxury-gold font-bold">${r.totalAmount}</td>
                          <td className="py-4">${r.paidAmount}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              r.status === 'Exact' ? 'bg-green-500/20 text-green-400' :
                              r.status === 'Overpaid' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {t(`groups.status_${r.status.toLowerCase()}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
