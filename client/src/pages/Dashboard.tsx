import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PlusCircle,
  TrendUp,
  Clock,
  Hourglass,
  Trash,
  Wallet,
} from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector } from '../store/hooks';
import {
  useGetTimeSummaryQuery,
  useGetTimeLogsQuery,
  useAddTimeLogMutation,
  useDeleteTimeLogMutation,
  useGetMyGroupsQuery,
} from '../store/api/apiSlice';
import {
  useStoredMoney,
  useDisplayMode,
  formatCurrencyTotals,
  moneyByRateCurrency,
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

const EntrySchema = Yup.object().shape({
  date: Yup.date().typeError('Pick a date').required('Date is required'),
  hours: Yup.number()
    .typeError('Enter a number')
    .min(0.1, 'Minimum 0.1h')
    .max(24, 'A day has 24 hours')
    .required('Hours are required'),
  groupId: Yup.string().nullable(),
});

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
  const { data: groupsData } = useGetMyGroupsQuery();
  const [addTimeLog, { isLoading: adding }] = useAddTimeLogMutation();
  const [deleteTimeLog] = useDeleteTimeLogMutation();

  const groups = groupsData?.data || [];
  const logs = logsData?.data || [];

  const handleAdd = async (
    values: { date: string; hours: number | string; groupId: string },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      await addTimeLog({
        date: values.date,
        hours: Number(values.hours),
        groupId: values.groupId || null,
      }).unwrap();
      toast.success(t('dashboard.entry_saved'));
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

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
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
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

      {/* Stat row: separated by hairlines, no card boxes */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8 grid grid-cols-2 divide-line border-y border-line lg:grid-cols-4 lg:divide-x"
      >
        {stats.map(({ label, value, Icon }, i) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className={`stat-tile flex items-center gap-3.5 ${i < 2 ? 'border-b border-line lg:border-b-0' : ''} ${i % 2 === 1 ? 'border-s border-line ps-4 lg:border-s-0 lg:ps-6' : ''}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent shadow-[0_2px_8px_-2px_rgb(var(--c-glow)/0.2)]">
              <Icon size={20} weight="light" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] text-muted">{label}</p>
              {summaryLoading ? (
                <div className="skeleton mt-1.5 h-6 w-24" />
              ) : (
                <p className="num-display mt-0.5 text-xl font-semibold tracking-tight text-ink">{value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
        {/* Log form */}
        <Reveal className="h-fit">
          <section className="card-deep h-fit p-6 elevated">
          <h2 className="flex items-center gap-2 font-semibold">
            <PlusCircle size={19} weight="light" className="text-accent" />
            {t('dashboard.log_time')}
          </h2>
          <Formik
            initialValues={{
              date: toDateInput(new Date()),
              hours: '',
              groupId: '',
            }}
            validationSchema={EntrySchema}
            onSubmit={handleAdd}
          >
            {({ isSubmitting }) => (
              <Form className="mt-5 space-y-4">
                <div>
                  <Field name="date">
                    {({ field, form }: any) => (
                      <DateField
                        label={t('common.date')}
                        value={field.value || ''}
                        onChange={(iso) => form.setFieldValue('date', iso)}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="date" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="entry-hours">
                    {t('common.hours')} <span className="text-muted">({t('common.hours_unit')})</span>
                  </label>
                  <Field
                    id="entry-hours"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    name="hours"
                    className="field mt-1.5 num"
                    placeholder="8"
                  />
                  <ErrorMessage name="hours" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="entry-group">{t('dashboard.group')}</label>
                  <Field as="select" id="entry-group" name="groupId" className="field mt-1.5">
                    <option value="">{t('dashboard.group_personal')}</option>
                    {groups.map((g: any) => (
                      <option key={g._id} value={g._id}>
                        {g.name} · {moneyByRateCurrency(g.hourlyRate, g.hourlyRateCurrency || 'usd')}/{t('common.hr')}
                      </option>
                    ))}
                  </Field>
                </div>
                <button type="submit" disabled={isSubmitting || adding} className="btn-primary w-full py-3">
                  {isSubmitting || adding ? t('common.loading') : t('dashboard.save_btn')}
                </button>
              </Form>
            )}
          </Formik>
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
            <div className="overflow-x-auto">
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
          )}
        </section>
        </Reveal>
      </div>
    </main>
  );
};

export default Dashboard;
