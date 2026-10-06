import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Plus, Calendar, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [timeEntry, setTimeEntry] = useState({ date: '', hours: '', groupId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const logsRes = await apiClient.get('/time/logs');
      setLogs(logsRes.data.data);

      const now = new Date();
      const earningsRes = await apiClient.get(`/time/earnings?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      setEarnings(earningsRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/time/logs', {
        ...timeEntry,
        hours: Number(timeEntry.hours)
      });
      setTimeEntry({ date: '', hours: '', groupId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add log');
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-luxury-black text-luxury-gold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-10">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, <span className="text-luxury-gold">{user?.username}</span></h1>
          <p className="text-gray-400">Here is your performance overview for this month.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/profile" className="px-4 py-2 rounded-lg bg-luxury-darkGray border border-white/10 hover:border-luxury-gold transition-all">Profile</Link>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Logout</button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-3xl bg-luxury-darkGray border border-white/10 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-luxury-gold/20 text-luxury-gold"><TrendingUp className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-400 text-sm">Monthly Earnings</p>
            <h3 className="text-3xl font-bold">${earnings?.totalEarnings?.toFixed(2) || '0.00'}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-3xl bg-luxury-darkGray border border-white/10 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400"><Clock className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-400 text-sm">Hours Worked</p>
            <h3 className="text-3xl font-bold">{logs.reduce((sum, l) => sum + l.hours, 0).toFixed(1)}h</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-3xl bg-luxury-darkGray border border-white/10 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-purple-500/20 text-purple-400"><Users className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-400 text-sm">Active Groups</p>
            <h3 className="text-3xl font-bold">Ready to Join</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Time Entry Form */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-luxury-gold" /> Log Time
            </h2>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all"
                  value={timeEntry.date}
                  onChange={(e) => setTimeEntry({...timeEntry, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all"
                  value={timeEntry.hours}
                  onChange={(e) => setTimeEntry({...timeEntry, hours: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Group ID (Optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl outline-none focus:border-luxury-gold transition-all"
                  value={timeEntry.groupId}
                  onChange={(e) => setTimeEntry({...timeEntry, groupId: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-3 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-goldLight transition-all duration-300">
                Save Entry
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10 overflow-hidden">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-luxury-gold" /> Work History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Hours</th>
                    <th className="pb-4 font-medium">Amount</th>
                    <th className="pb-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 text-sm">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-4 text-sm">{log.hours}h</td>
                      <td className="py-4 text-sm font-medium text-luxury-gold">${log.amount}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-500">No logs found. Start tracking your time!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
