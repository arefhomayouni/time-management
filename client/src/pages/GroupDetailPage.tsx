import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Users,
  UserPlus,
  UserMinus,
  CurrencyDollar,
  Wallet,
  Clock,
  ChartBar,
  X,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector } from '../store/hooks';
import {
  useGetGroupDetailsQuery,
  useGetGroupMembersQuery,
  useGetGroupInvitationsQuery,
  useUpdateGroupMutation,
  useInviteUserMutation,
  useRemoveGroupMemberMutation,
  useCancelInvitationMutation,
  useGetGroupReportQuery,
  useGetGroupPaymentsQuery,
  useMakePaymentMutation,
} from '../store/api/apiSlice';
import { hours as fmtHours, moneyByRateCurrency, monthRange } from '../utils/format';
import { groupSchema } from '../utils/groupSchema';
import { useCalendar } from '../hooks/useCalendar';
import CurrencyToggle from '../components/groups/CurrencyToggle';
import JalaliDateRangePicker from '../components/common/JalaliDateRangePicker';
import { TiltCard, staggerContainer, staggerItem, EASE_OUT } from '../components/motion/kinetics';
import type { RateCurrency } from '../store/slices/authSlice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Avatar: React.FC<{ name?: string }> = ({ name }) => (
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-semibold uppercase text-accent">
    {(name || '?').slice(0, 1)}
  </span>
);

const Stat: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-xl border border-line/70 bg-inset/40 px-4 py-3">
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {icon}
      {label}
    </div>
    <div className="num-display mt-1.5 text-lg text-ink">{value}</div>
  </div>
);

/**
 * Group workspace.
 *
 * Manager: edit settings, invite / remove members, cancel pending invites,
 * read the per-member report for a date range and record payouts.
 * Member: read-only view of the group and its members - no payout or report
 * controls, since the API restricts those to the manager.
 */
const GroupDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatDate } = useCalendar();
  const reduce = useReducedMotion();
  const currentUser = useAppSelector((s) => s.auth.user);

  const { data: groupData, isLoading: groupLoading } = useGetGroupDetailsQuery(id, {
    skip: !id,
  });
  const { data: membersData } = useGetGroupMembersQuery(id, { skip: !id });

  const group = (groupData?.data as any)?.group ?? null;
  const groupCurrency: RateCurrency = (group?.hourlyRateCurrency ?? 'usd') as RateCurrency;
  const isManager =
    groupData?.data?.isManager ??
    membersData?.data?.isManager ??
    (group ? String(group.manager) === currentUser?._id : false);

  const { data: invitationsData } = useGetGroupInvitationsQuery(id, {
    skip: !id || !isManager,
  });

  const now = new Date();
  const [range, setRange] = useState(() =>
    monthRange(now.getFullYear(), now.getMonth() + 1)
  );

  const { data: reportRes, isFetching: reportLoading } = useGetGroupReportQuery(
    { id, startDate: range.startDate, endDate: range.endDate },
    { skip: !id || !isManager || !range.startDate || !range.endDate }
  );
  const { data: payoutsRes } = useGetGroupPaymentsQuery(
    { groupId: id, startDate: range.startDate, endDate: range.endDate },
    { skip: !id || !isManager || !range.startDate || !range.endDate }
  );

  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();
  const [inviteUser, { isLoading: inviting }] = useInviteUserMutation();
  const [removeGroupMember, { isLoading: removing }] = useRemoveGroupMemberMutation();
  const [cancelInvitation, { isLoading: cancelling }] = useCancelInvitationMutation();
  const [makePayment, { isLoading: paying }] = useMakePaymentMutation();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [payout, setPayout] = useState({ userId: '', amount: '', notes: '' });
  const [payoutError, setPayoutError] = useState('');

  const members = membersData?.data?.members || [];
  const pendingInvites = invitationsData?.data?.invitations || [];
  const report = reportRes?.data;
  const payouts = payoutsRes?.data?.payments || [];

  const money = (n: number | undefined | null) => moneyByRateCurrency(n, groupCurrency);

  const handleSaveSettings = async (values: any, { setSubmitting }: any) => {
    if (!id) return;
    try {
      await updateGroup({
        id,
        name: values.name.trim(),
        hourlyRate: Number(values.hourlyRate),
        hourlyRateCurrency: values.hourlyRateCurrency as RateCurrency,
        budget: values.budget === '' ? 0 : Number(values.budget),
      }).unwrap();
      toast.success(t('group.settings_saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!EMAIL_RE.test(email)) {
      setInviteError(t('groups.email_invalid'));
      return;
    }
    setInviteError('');
    try {
      await inviteUser({ email, groupId: id }).unwrap();
      toast.success(t('groups.invite_sent'));
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!window.confirm(t('groups.remove_confirm').replace('{name}', username))) return;
    try {
      await removeGroupMember({ id, userId }).unwrap();
      toast.success(t('groups.member_removed'));
      if (payout.userId === userId) setPayout((p) => ({ ...p, userId: '' }));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await cancelInvitation({ id, invitationId }).unwrap();
      toast.success(t('groups.invite_cancelled'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payout.amount);
    if (!payout.userId) {
      setPayoutError(t('group.select_member'));
      return;
    }
    if (!amount || amount <= 0) {
      setPayoutError(t('group.payout_invalid'));
      return;
    }
    setPayoutError('');
    try {
      const res: any = await makePayment({
        userId: payout.userId,
        amount,
        groupId: id,
        startDate: range.startDate,
        endDate: range.endDate,
        notes: payout.notes.trim() || undefined,
      }).unwrap();
      const settled = res?.data?.settledLogs ?? 0;
      const leftover = res?.data?.leftover ?? 0;
      toast.success(
        `${t('group.payout_done')} · ${t('group.payout_settled')} ${settled}` +
          (leftover > 0 ? ` · ${t('group.payout_leftover')} ${money(leftover)}` : '')
      );
      setPayout({ userId: '', amount: '', notes: '' });
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const statusLabel = (status: string) =>
    status === 'Overpaid'
      ? t('groups.status_overpaid')
      : status === 'Exact'
      ? t('groups.status_exact')
      : t('groups.status_underpaid');

  if (groupLoading) {
    return (
      <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
        <div className="aurora" aria-hidden="true" />
        <div className="relative z-10 space-y-4">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-64 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
        <div className="aurora" aria-hidden="true" />
        <div className="relative z-10 text-center">
          <p className="text-sm text-muted">{t('group.not_found')}</p>
          <button onClick={() => navigate('/groups')} className="btn-ghost mt-4 inline-flex">
            {t('nav.groups')}
          </button>
        </div>
      </main>
    );
  }

  const budget = Number(group.budget || 0);
  const spent = report?.totals.totalAmount ?? 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10"
      >
        <button onClick={() => navigate('/groups')} className="btn-ghost mb-3 !py-1.5">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t('nav.back')}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{group.name}</h1>
          <span
            className={`badge ${isManager ? 'bg-accent/10 text-accent' : 'bg-inset text-muted'}`}
          >
            {isManager ? t('groups.role_manager') : t('groups.role_member')}
          </span>
        </div>
        <p className="mt-1.5 text-muted">
          {isManager ? t('group.manager_hint') : t('group.member_hint')}
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.1)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[300px_1fr]"
      >
        {/* Summary */}
        <motion.section variants={staggerItem}>
          <TiltCard max={6} className="h-full">
            <section className="card-deep h-full p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                <CurrencyDollar size={24} weight="light" />
              </div>
              <div className="mt-4 text-xs text-muted">{t('groups.hourly_rate')}</div>
              <div className="num-display mt-0.5 text-xl">
                {money(group.hourlyRate)}
                <span className="text-sm font-normal text-muted">/{t('common.hr')}</span>
              </div>

              <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('groups.role_label')}</dt>
                  <dd>{isManager ? t('groups.role_manager') : t('groups.role_member')}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('groups.members_title')}</dt>
                  <dd className="num">{members.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('groups.created_on')}</dt>
                  <dd className="num text-xs">{formatDate(group.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('groups.budget_short')}</dt>
                  <dd className="num">{budget ? money(budget) : t('groups.no_budget')}</dd>
                </div>
              </dl>

              {isManager && budget > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{t('groups.budget_used')}</span>
                    <span className="num">{budgetPct}%</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-inset"
                    role="progressbar"
                    aria-valuenow={budgetPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full ${
                        budgetPct >= 100 ? 'bg-accent' : 'bg-success'
                      }`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted tabular-nums">
                    {money(spent)} / {money(budget)}
                  </p>
                </div>
              )}
            </section>
          </TiltCard>
        </motion.section>

        <motion.section variants={staggerItem} className="space-y-6">
          {/* Members + invitations */}
          <section className="card-deep p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <Users size={18} weight="light" className="text-accent" />
                {t('groups.members_title')}
                <span className="badge bg-inset text-muted">{members.length}</span>
              </h2>
            </div>

            <ul className="mt-5 divide-y divide-line/70">
              {members.map((m: any) => {
                const isGroupManager = String(group.manager) === String(m._id);
                return (
                  <li key={m._id} className="flex items-center gap-3 py-3">
                    <Avatar name={m.username} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 truncate text-sm font-medium text-ink">
                        {m.username}
                        {String(m._id) === currentUser?._id && (
                          <span className="text-xs font-normal text-muted">
                            ({t('groups.you')})
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted" dir="ltr">
                        {m.email}
                      </p>
                    </div>
                    {isGroupManager ? (
                      <span className="badge bg-accent/10 text-accent">
                        {t('groups.role_manager')}
                      </span>
                    ) : isManager ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m._id, m.username)}
                        disabled={removing}
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-60"
                      >
                        <UserMinus size={13} />
                        {t('groups.remove_member')}
                      </button>
                    ) : (
                      <span className="badge bg-inset text-muted">{t('groups.role_member')}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {isManager && (
              <form onSubmit={handleInvite} className="mt-5 border-t border-line pt-5" noValidate>
                <label className="label" htmlFor="invite-email">
                  {t('groups.invite_title')}
                </label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteError) setInviteError('');
                    }}
                    placeholder="you@team.com"
                    dir="ltr"
                    autoComplete="off"
                    className={`field max-w-sm flex-1 ${inviteError ? 'border-accent' : ''}`}
                    aria-invalid={Boolean(inviteError)}
                    aria-describedby={inviteError ? 'invite-error' : undefined}
                  />
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="btn-primary px-4 py-2.5"
                  >
                    <UserPlus size={16} />
                    {inviting ? t('common.loading') : t('groups.invite_btn')}
                  </button>
                </div>
                {inviteError ? (
                  <p id="invite-error" className="mt-1.5 text-xs text-accent">
                    {inviteError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">{t('groups.invite_hint')}</p>
                )}
              </form>
            )}

            {isManager && pendingInvites.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('groups.pending_invites')}
                </h3>
                <ul className="mt-2 space-y-2">
                  {pendingInvites.map((inv: any) => (
                    <li
                      key={inv._id}
                      className="flex items-center gap-3 rounded-lg border border-line/70 bg-inset/40 px-3 py-2"
                    >
                      <Clock size={15} className="shrink-0 text-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {inv.toUser?.username || inv.toUser?.email}
                        </p>
                        <p className="truncate text-xs text-muted" dir="ltr">
                          {inv.toUser?.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(inv._id)}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-accent disabled:opacity-60"
                        aria-label={`${t('groups.cancel_invite')} ${inv.toUser?.email || ''}`}
                      >
                        <X size={14} />
                        {t('groups.cancel_invite')}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Manager tools */}
          {isManager ? (
            <>
              <section className="card-deep p-6 sm:p-7">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Pencil size={17} weight="light" className="text-accent" />
                  {t('group.settings')}
                </h2>

                <Formik
                  enableReinitialize
                  initialValues={{
                    name: group.name || '',
                    hourlyRate: group.hourlyRate ?? 0,
                    hourlyRateCurrency: groupCurrency,
                    budget: group.budget ?? 0,
                  }}
                  validationSchema={groupSchema}
                  onSubmit={handleSaveSettings}
                >
                  {({ isSubmitting, values, setFieldValue, errors, touched }) => (
                    <Form className="mt-5 space-y-5" noValidate>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="label" htmlFor="g-name">
                            {t('groups.group_name')}
                          </label>
                          <Field id="g-name" name="name" className="field mt-1.5" />
                          <ErrorMessage
                            name="name"
                            component="p"
                            className="mt-1.5 text-xs text-accent"
                          />
                        </div>

                        <div>
                          <label className="label" htmlFor="s-rate">
                            {t('groups.hourly_rate')}
                          </label>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Field
                              id="s-rate"
                              type="number"
                              step="any"
                              min="0"
                              inputMode="decimal"
                              name="hourlyRate"
                              className={`field num max-w-[150px] ${
                                touched.hourlyRate && errors.hourlyRate ? 'border-accent' : ''
                              }`}
                            />
                            <CurrencyToggle
                              value={values.hourlyRateCurrency}
                              onChange={(currency) =>
                                setFieldValue('hourlyRateCurrency', currency)
                              }
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-muted tabular-nums">
                            {money(Number(values.hourlyRate) || 0)}/{t('common.hr')}
                          </p>
                          <ErrorMessage
                            name="hourlyRate"
                            component="p"
                            className="mt-1.5 text-xs text-accent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label" htmlFor="s-budget">
                          {t('groups.budget')}
                        </label>
                        <Field
                          id="s-budget"
                          type="number"
                          step="any"
                          min="0"
                          name="budget"
                          className="field num mt-1.5 max-w-[220px]"
                        />
                        <p className="mt-1.5 text-xs text-muted">{t('groups.budget_hint')}</p>
                        <ErrorMessage
                          name="budget"
                          component="p"
                          className="mt-1.5 text-xs text-accent"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || updating}
                        className="btn-primary px-6 py-3"
                      >
                        {isSubmitting || updating
                          ? t('common.loading')
                          : t('group.save_settings')}
                      </button>
                    </Form>
                  )}
                </Formik>
              </section>

              {/* Report + payouts */}
              <section className="card-deep p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <ChartBar size={18} weight="light" className="text-accent" />
                    {t('groups.report_title')}
                  </h2>
                  <span className="badge bg-inset text-muted uppercase">{groupCurrency}</span>
                </div>

                <JalaliDateRangePicker
                  value={range}
                  onChange={setRange}
                  label={t('group.report_range')}
                  className="mt-4"
                />

                {reportLoading ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-[70px]" />
                    ))}
                  </div>
                ) : report ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Stat
                        label={t('groups.report_table_hours')}
                        value={`${fmtHours(report.totals.totalHours)} ${t('common.hours_unit')}`}
                        icon={<Clock size={12} />}
                      />
                      <Stat
                        label={t('group.owed_summary')}
                        value={money(report.totals.totalAmount)}
                        icon={<CurrencyDollar size={12} />}
                      />
                      <Stat
                        label={t('groups.report_table_paid')}
                        value={money(report.totals.paidAmount)}
                        icon={<Wallet size={12} />}
                      />
                      <Stat
                        label={t('group.remaining_summary')}
                        value={money(report.totals.remainingAmount)}
                        icon={<Wallet size={12} />}
                      />
                    </div>

                    {report.reports.length === 0 ? (
                      <p className="mt-5 rounded-xl border border-line/70 bg-inset/40 px-4 py-6 text-center text-sm text-muted">
                        {t('group.no_report')}
                      </p>
                    ) : (
                      <>
                      {/* Mobile: per-member summary rows */}
                      <ul className="mt-5 lg:hidden">
                        {report.reports.map((row) => (
                          <li key={row.userId} className="data-row">
                            <Avatar name={row.username} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[13px] font-medium text-ink">
                                  {row.username}
                                </p>
                                <span
                                  className={`badge !px-1.5 !py-0 !text-[10px] ${
                                    row.status === 'Exact'
                                      ? 'bg-success/10 text-success'
                                      : row.status === 'Overpaid'
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-inset text-muted'
                                  }`}
                                >
                                  {statusLabel(row.status)}
                                </span>
                              </div>
                              <p className="num mt-0.5 truncate text-[11px] text-muted">
                                {fmtHours(row.totalHours)} {t('common.hours_unit')} ·{' '}
                                {t('groups.report_table_remaining')} {money(row.remainingAmount)}
                              </p>
                            </div>
                            <span className="num shrink-0 text-[14px] font-semibold text-ink">
                              {money(row.totalAmount)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Desktop: full report table */}
                      <div className="mt-5 hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[560px] border-collapse">
                          <thead>
                            <tr className="border-b border-line">
                              <th className="table-head">{t('groups.report_table_member')}</th>
                              <th className="table-head text-end">
                                {t('groups.report_table_hours')}
                              </th>
                              <th className="table-head text-end">
                                {t('groups.report_table_owed')}
                              </th>
                              <th className="table-head text-end">
                                {t('groups.report_table_paid')}
                              </th>
                              <th className="table-head text-end">
                                {t('groups.report_table_remaining')}
                              </th>
                              <th className="table-head">{t('groups.report_table_status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/60">
                            {report.reports.map((row) => (
                              <tr key={row.userId} className="hover:bg-inset/50">
                                <td className="table-cell">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar name={row.username} />
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-ink">
                                        {row.username}
                                      </p>
                                      <p className="truncate text-xs text-muted" dir="ltr">
                                        {row.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="table-cell num text-end">
                                  {fmtHours(row.totalHours)}
                                </td>
                                <td className="table-cell num text-end">
                                  {money(row.totalAmount)}
                                </td>
                                <td className="table-cell num text-end">
                                  {money(row.paidAmount)}
                                </td>
                                <td className="table-cell num text-end font-medium">
                                  {money(row.remainingAmount)}
                                </td>
                                <td className="table-cell">
                                  <span
                                    className={`badge ${
                                      row.status === 'Exact'
                                        ? 'bg-success/10 text-success'
                                        : row.status === 'Overpaid'
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-inset text-muted'
                                    }`}
                                  >
                                    {statusLabel(row.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="mt-5 rounded-xl border border-line/70 bg-inset/40 px-4 py-6 text-center text-sm text-muted">
                    {t('common.error')}
                  </p>
                )}
              </section>

              <section className="card-deep p-6 sm:p-7">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Wallet size={18} weight="light" className="text-accent" />
                  {t('group.payout_title')}
                </h2>
                <p className="mt-1.5 text-sm text-muted">{t('group.payout_desc')}</p>

                <form onSubmit={handlePayout} className="mt-5 space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                      <label className="label" htmlFor="payout-member">
                        {t('group.member')}
                      </label>
                      <select
                        id="payout-member"
                        value={payout.userId}
                        onChange={(e) => {
                          setPayout((p) => ({ ...p, userId: e.target.value }));
                          if (payoutError) setPayoutError('');
                        }}
                        className="field mt-1.5"
                      >
                        <option value="">{t('group.select_member')}</option>
                        {members.map((m: any) => (
                          <option key={m._id} value={m._id}>
                            {m.username} — {m.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="payout-amount">
                        {t('group.payout_amount')} ({groupCurrency.toUpperCase()})
                      </label>
                      <input
                        id="payout-amount"
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        value={payout.amount}
                        onChange={(e) => {
                          setPayout((p) => ({ ...p, amount: e.target.value }));
                          if (payoutError) setPayoutError('');
                        }}
                        className="field num mt-1.5"
                        placeholder={groupCurrency === 'irr' ? '30000000' : '45'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="payout-notes">
                      {t('group.payout_notes')}
                    </label>
                    <input
                      id="payout-notes"
                      type="text"
                      value={payout.notes}
                      onChange={(e) => setPayout((p) => ({ ...p, notes: e.target.value }))}
                      className="field mt-1.5"
                      autoComplete="off"
                    />
                  </div>

                  {payoutError && <p className="text-xs text-accent">{payoutError}</p>}

                  <button
                    type="submit"
                    disabled={paying}
                    className="btn-primary px-5 py-2.5"
                  >
                    {paying ? t('common.loading') : t('group.payout_submit')}
                  </button>
                </form>

                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('group.payouts_history')}
                  </h3>
                  {payouts.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">{t('group.no_payouts')}</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {payouts.map((p: any) => (
                        <li
                          key={p._id}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line/70 bg-inset/40 px-3 py-2.5 text-sm"
                        >
                          <span className="font-medium text-ink">
                            {p.user?.username || t('group.paid_to')}
                          </span>
                          <span className="num text-xs text-muted">{formatDate(p.date)}</span>
                          <span className="num ms-auto font-semibold text-ink">
                            {money(p.amount)}
                          </span>
                          {p.notes && (
                            <span className="w-full text-xs text-muted">{p.notes}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="card-deep p-6 sm:p-7">
              <h2 className="flex items-center gap-2 font-semibold">
                <Pencil size={17} weight="light" className="text-accent" />
                {t('groups.hourly_rate')}
              </h2>
              <p className="mt-2 text-sm text-muted">{t('group.member_note')}</p>
              <p className="num-display mt-4 text-xl">
                {money(group.hourlyRate)}
                <span className="text-sm font-normal text-muted">/{t('common.hr')}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {t('groups.budget_short')}: {budget ? money(budget) : t('groups.no_budget')}
              </p>
            </section>
          )}
        </motion.section>
      </motion.div>

    </main>
  );
};

export default GroupDetailPage;
