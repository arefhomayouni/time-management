import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/api';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await apiClient.get('/payments/my-payments');
        setPayments(res.data.data);
      } catch (err) {
        console.error('Error fetching payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-luxury-black text-luxury-gold">{t('common.loading')} Payments...</div>;

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-10 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('payments.title')}</h1>
            <p className="text-gray-400">{t('payments.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="p-8 rounded-3xl bg-luxury-darkGray border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 text-sm border-b border-white/10">
                  <tr>
                    <th className="pb-4 font-medium">{t('payments.table_date')}</th>
                    <th className="pb-4 font-medium">{t('payments.table_method')}</th>
                    <th className="pb-4 font-medium">{t('payments.table_notes')}</th>
                    <th className="pb-4 font-medium text-right">{t('payments.table_amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 text-sm">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs border border-white/10 uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-400">{p.notes || t('common.no_notes')}</td>
                      <td className="py-4 text-right font-bold text-luxury-gold">${p.amount}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-500">{t('payments.no_payments')}</td>
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

export default PaymentsPage;
