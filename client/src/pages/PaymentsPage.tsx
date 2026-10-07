import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useGetMyPaymentsQuery } from '../store/api/apiSlice';
import { money, shortDate, monthRange, toDateInput } from '../utils/format';

const PaymentsPage: React.FC = () => {
  const { t } = useLanguage();
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
  const thisMonth = monthRange(now.getFullYear(), now.getMonth() + 1);

  return (
    <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('payments.title')}</h1>
          <p className="mt-1.5 text-muted">{t('payments.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRange(thisMonth)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            {t('dashboard.range_this_month')}
          </button>
          <input
            type="date"
            aria-label={t('common.from')}
            className="field num !w-auto !py-2"
            value={range.startDate}
            onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
          />
          <span className="text-muted">→</span>
          <input
            type="date"
            aria-label={t('common.to')}
            className="field num !w-auto !py-2"
            value={range.endDate}
            onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Total strip */}
      <div className="mt-8 flex items-center justify-between border-y border-line py-5">
        <span className="text-sm text-muted">{t('payments.total_received')}</span>
        {isLoading ? (
          <div className="skeleton h-7 w-32" />
        ) : (
          <span className="num text-2xl font-semibold text-accent">{money(total)}</span>
        )}
      </div>

      <section className="card mt-8 overflow-hidden">
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
          <div className="overflow-x-auto">
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
                    <td className="table-cell num text-muted">{shortDate(p.date)}</td>
                    <td className="table-cell">
                      <span className="badge bg-inset uppercase text-muted">{p.paymentMethod}</span>
                    </td>
                    <td className="table-cell text-muted">{p.notes || t('common.no_notes')}</td>
                    <td className="table-cell num text-end font-semibold text-accent">
                      {money(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default PaymentsPage;
