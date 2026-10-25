import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useGetMyPaymentsQuery } from '../store/api/apiSlice';
import {
  useStoredMoney,
  useDisplayMode,
  formatCurrencyTotals,
  toDateInput,
} from '../utils/format';
import { useCalendar } from '../hooks/useCalendar';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal, EASE_OUT } from '../components/motion/kinetics';
import JalaliDateRangePicker from '../components/common/JalaliDateRangePicker';

const PaymentsPage: React.FC = () => {
  const { t } = useLanguage();
  const storedMoney = useStoredMoney();
  const displayMode = useDisplayMode();
  const { formatDate } = useCalendar();
  const reduce = useReducedMotion();
  const now = new Date();
  const [range, setRange] = useState(() => {
    // Default: last 90 days so new users see something meaningful
    return {
      startDate: toDateInput(new Date(now.getTime() - 90 * 86400000)),
      endDate: toDateInput(now),
    };
  });

  const { data, isLoading, isError } = useGetMyPaymentsQuery(range);

  useEffect(() => {
    if (isError) toast.error(t('common.error'));
  }, [isError, t]);

  const payments = data?.data?.payments || [];
  const total = data?.data?.total ?? 0;

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('payments.title')}</h1>
          <p className="mt-1.5 text-muted">{t('payments.subtitle')}</p>
        </div>

        <JalaliDateRangePicker
          value={{ startDate: range.startDate, endDate: range.endDate }}
          onChange={(range) => setRange({ ...range })}
          className="!w-full"
        />
      </motion.div>

      {/* Total strip */}
      <div className="relative z-10 mt-8 flex items-center justify-between border-y border-line py-5">
        <span className="text-sm text-muted">{t('payments.total_received')}</span>
        {isLoading ? (
          <div className="skeleton h-7 w-32" />
        ) : (
          <span className="num-display text-2xl font-semibold text-accent">
            {formatCurrencyTotals(data?.data?.totals, displayMode, { amount: total })}
          </span>
        )}
      </div>

      <Reveal className="relative z-10">
      <section className="card-deep elevated mt-8 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Wallet size={34} className="mx-auto text-muted/60" />
            <p className="mt-3 text-sm text-muted">{t('payments.no_payments')}</p>
          </div>
        ) : (
          <>
            {/* Mobile: dense payment rows */}
            <ul className="lg:hidden">
              {payments.map((p: any) => (
                <li key={p._id} className="data-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[13px] font-medium text-ink">
                        {formatDate(p.date)}
                      </span>
                      <span className="badge !px-1.5 !py-0 !text-[10px] bg-inset uppercase text-muted">
                        {p.paymentMethod}
                      </span>
                    </div>
                    {p.notes && (
                      <p className="mt-0.5 truncate text-[11px] text-muted">{p.notes}</p>
                    )}
                  </div>
                  <span className="num shrink-0 text-[15px] font-semibold text-ink">
                    {storedMoney(p.amount, p.currency === 'irr' ? 'irr' : 'usd')}
                  </span>
                </li>
              ))}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="table-head">{t('payments.table_date')}</th>
                    <th className="table-head">{t('payments.table_method')}</th>
                    <th className="table-head">{t('payments.table_notes')}</th>
                    <th className="table-head text-end">{t('payments.table_amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {payments.map((p: any) => (
                    <tr key={p._id} className="transition-colors hover:bg-inset/60">
                      <td className="table-cell num text-muted">{formatDate(p.date)}</td>
                      <td className="table-cell">
                        <span className="badge bg-inset uppercase text-muted">{p.paymentMethod}</span>
                      </td>
                      <td className="table-cell text-muted">{p.notes || t('common.no_notes')}</td>
                      <td className="table-cell num text-end font-semibold text-ink">
                        {storedMoney(p.amount, p.currency === 'irr' ? 'irr' : 'usd')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      </Reveal>
    </main>
  );
};

export default PaymentsPage;
