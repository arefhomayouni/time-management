import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from '../lib/toast';
import { motion, useReducedMotion } from 'framer-motion';
import { PlusCircle, TrendUp, Clock, Hourglass, Trash, Wallet } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector } from '../store/hooks';
import {
  useGetTimeSummaryQuery,
  useGetTimeLogsQuery,
  useDeleteTimeLogMutation,
} from '../store/api/apiSlice';
import LogTimeForm from '../components/dashboard/LogTimeForm';
import LogTimeFab from '../components/mobile/LogTimeFab';
import {
  useStoredMoney,
  useDisplayMode,
  formatCurrencyTotals,
  hours as fmtHours,
  monthRange,
  toDateInput,
} from '../utils/format';
import { useCalendar } from '../hooks/useCalendar';
import DateField from '../components/common/JalaliDateInput';
import {
  Reveal,
  staggerContainer,
  staggerItem,
} from '../components/motion/kinetics';

type RangeKey = 'this' | 'last' | '30' | 'custom';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const storedMoney = useStoredMoney();
  const displayMode = useDisplayMode();
  const { formatDate } = useCalendar();
  const reduce = useReducedMotion();
  const user = useAppSelector((s) => s.auth.user);
  const [rangeKey, setRangeKey] = useState<RangeKey>('this');
  const [custom, setCustom] = useState(() => {
    const now = new Date();
    return monthRange(now.getFullYear(), now.getMonth() + 1);
  });

  // Resolve the active range: presets override custom inputs
  const range = useMemo(() => {
    const now = new Date();
    if (rangeKey === 'this') return monthRange(now.getFullYear(), now.getMonth() + 1);
    if (rangeKey === 'last') return monthRange(now.getFullYear(), now.getMonth());
    return {
      startDate: toDateInput(new Date(now.getTime() - 30 * 86400000)),
      endDate: toDateInput(now),
    };
  }, [rangeKey]);

  const params = rangeKey === 'custom' ? custom : range;

  const { data: summary, isLoading: summaryLoading } = useGetTimeSummaryQuery(params);
  const { data: logsData, isLoading: logsLoading } = useGetTimeLogsQuery({
    ...params,
    limit: '100',
    sort: '-date',
  });
  const [deleteTimeLog] = useDeleteTimeLogMutation();

  const logs = logsData?.data || [];

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('dashboard.delete_confirm'))) return;
    try {
      await deleteTimeLog(id).unwrap();
      toast.success(t('dashboard.entry_deleted'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  /** Per-currency slice of the summary, e.g. { usd: 120, irr: 25000000 }. */
  const totalsFor = (key: 'earned' | 'paid' | 'pending') => {
    const t = summary?.currencyTotals;
    return t ? { usd: t.usd[key], irr: t.irr[key] } : undefined;
  };

  // Amounts stay in the currency they were earned in; a mixed period shows
  // both (never a single converted sum).
  const stats = [
    {
      label: t('dashboard.monthly_earnings'),
      value: formatCurrencyTotals(totalsFor('earned'), displayMode, {
        amount: summary?.totalAmount,
      }),
      Icon: TrendUp,
    },
    { label: t('dashboard.hours_worked'), value: `${fmtHours(summary?.totalHours)} ${t('common.hours_unit')}`, Icon: Clock },
    {
      label: t('dashboard.pending_amount'),
      value: formatCurrencyTotals(totalsFor('pending'), displayMode, {
        amount: summary?.pendingAmount,
      }),
      Icon: Hourglass,
    },
    { label: t('dashboard.days_worked'), value: String(summary?.days.length || 0), Icon: Wallet },
  ];

  const presets: { key: RangeKey; label: string }[] = [
    { key: 'this', label: t('dashboard.range_this_month') },
    { key: 'last', label: t('dashboard.range_last_month') },
    { key: '30', label: t('dashboard.range_30') },
  ];

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />
      {/* Header + range control */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('dashboard.welcome')}, <span className="text-accent">{user?.username}</span>
          </h1>
          <p className="mt-1.5 text-muted">{t('dashboard.overview')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('dashboard.range_label')}>
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setRangeKey(p.key as RangeKey)}
                className={`rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors ${rangeKey === p.key ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface text-muted hover:text-ink'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <DateField
              label={t('common.date')}
              value={params.startDate}
              onChange={(iso) => {
                setRangeKey('custom');
                setCustom((c) => ({ ...c, startDate: iso }));
              }}
              className="!w-full"
            />
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs">→</span>
              <DateField
                label={t('common.to')}
                value={params.endDate}
                onChange={(iso) => {
                  setRangeKey('custom');
                  setCustom((c) => ({ ...c, endDate: iso }));
                }}
                className="!w-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat row: a swipeable strip on mobile, a hairline-divided row on desktop */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="stat-strip relative z-10 mt-6 border-y border-line py-3 lg:mt-8 lg:grid lg:grid-cols-4 lg:divide-x lg:divide-line lg:py-0"
      >
        {stats.map(({ label, value, Icon }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className="stat-tile flex items-center gap-3 rounded-xl bg-inset/40 px-3 py-2.5 lg:bg-transparent lg:rounded-none lg:px-6 lg:py-5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon size={18} weight="light" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] leading-tight text-muted">{label}</p>
              {summaryLoading ? (
                <div className="skeleton mt-1 h-5 w-20" />
              ) : (
                <p className="num-display mt-0.5 truncate text-lg font-semibold tracking-tight text-ink">
                  {value}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
        {/* Log form: desktop only. On mobile the FAB + bottom sheet is the path. */}
        <Reveal className="h-fit hidden lg:block">
          <section className="card-deep h-fit p-6 elevated">
            <h2 className="flex items-center gap-2 font-semibold">
              <PlusCircle size={19} weight="light" className="text-accent" />
              {t('dashboard.log_time')}
            </h2>
            <LogTimeForm className="mt-5" />
          </section>
        </Reveal>

        {/* Entries table */}
        <Reveal>
        <section className="card-deep overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
            <h2 className="font-semibold">{t('dashboard.history_title')}</h2>
            <span className="num text-xs text-muted">
              {formatDate(params.startDate)} → {formatDate(params.endDate)}
            </span>
          </div>

          {logsLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-11 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Clock size={34} className="mx-auto text-muted/60" />
              <p className="mt-3 text-sm text-muted">{t('dashboard.no_logs')}</p>
              <Link to="/groups" className="btn-ghost mt-5 inline-flex">
                {t('nav.groups')}
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: dense entry list, one row per log */}
              <ul className="lg:hidden">
                {logs.map((log: any) => (
                  <li key={log._id} className="data-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="num text-[13px] font-medium text-ink">
                          {formatDate(log.date)}
                        </span>
                        <span
                          className={`badge !px-1.5 !py-0 !text-[10px] ${
                            log.status === 'paid'
                              ? 'bg-success/15 text-success'
                              : 'bg-warn/15 text-warn'
                          }`}
                        >
                          {log.status === 'paid'
                            ? t('dashboard.status_paid')
                            : t('dashboard.status_pending')}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {fmtHours(log.hours)} {t('common.hours_unit')} ·{' '}
                        {log.group ? t('groups.title') : t('dashboard.personal')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="num text-[15px] font-semibold text-ink">
                        {storedMoney(log.amount, log.currency === 'irr' ? 'irr' : 'usd')}
                      </span>
                      <button
                        onClick={() => handleDelete(log._id)}
                        className="tap-target grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                        aria-label={t('common.delete')}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: full table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head">{t('dashboard.table_date')}</th>
                      <th className="table-head">{t('dashboard.table_hours')}</th>
                      <th className="table-head">{t('dashboard.table_amount')}</th>
                      <th className="table-head">{t('dashboard.table_group')}</th>
                      <th className="table-head">{t('dashboard.table_status')}</th>
                      <th className="table-head text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {logs.map((log: any) => (
                      <tr key={log._id} className="transition-colors hover:bg-inset/60">
                        <td className="table-cell num text-muted">
                          {formatDate(log.date)}
                        </td>
                        <td className="table-cell num">{fmtHours(log.hours)}</td>
                        <td className="table-cell num font-semibold text-ink">
                          {storedMoney(log.amount, log.currency === 'irr' ? 'irr' : 'usd')}
                        </td>
                        <td className="table-cell text-muted">
                          {log.group ? t('groups.title') : t('dashboard.personal')}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge ${log.status === 'paid' ? 'bg-success/15 text-success' : 'bg-warn/15 text-warn'}`}
                          >
                            {log.status === 'paid'
                              ? t('dashboard.status_paid')
                              : t('dashboard.status_pending')}
                          </span>
                        </td>
                        <td className="table-cell text-end">
                          <button
                            onClick={() => handleDelete(log._id)}
                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                          >
                            <Trash size={16} />
                          </button>
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
      </div>

      {/* Mobile quick-log FAB (hidden on desktop by CSS) */}
      <LogTimeFab />
    </main>
  );
};

export default Dashboard;
