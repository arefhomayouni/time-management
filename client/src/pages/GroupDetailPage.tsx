import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Users,
  UserPlus,
  ChartLineUp,
  Wallet,
  Gear,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector } from '../store/hooks';
import {
  useGetGroupDetailsQuery,
  useGetGroupMembersQuery,
  useInviteUserMutation,
  useGetGroupReportQuery,
  useUpdateGroupMutation,
  useGetGroupPaymentsQuery,
  useMakePaymentMutation,
} from '../store/api/apiSlice';
import { useMoney, hours as fmtHours, monthRange, shortDate } from '../utils/format';
import JalaliDateRangePicker from '../components/common/JalaliDateRangePicker';

const InviteSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

const SettingsSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Too short').required('Required'),
  hourlyRate: Yup.number().typeError('Enter a number').min(0, 'Cannot be negative').required('Required'),
  budget: Yup.number().typeError('Enter a number').min(0, 'Cannot be negative').required('Required'),
});

const PayoutSchema = Yup.object().shape({
  userId: Yup.string().required('Pick a member'),
  amount: Yup.number()
    .typeError('Enter a number')
    .positive('Must be greater than 0')
    .required('Amount is required'),
  notes: Yup.string().max(300, 'Too long'),
});

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const money = useMoney();
  const user = useAppSelector((s) => s.auth.user);

  const now = new Date();
  const [range, setRange] = useState(() => monthRange(now.getFullYear(), now.getMonth() + 1));

  const { data: groupData, isLoading: groupLoading } = useGetGroupDetailsQuery(id!);
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(id!);
  const { data: reportData, isLoading: reportLoading } = useGetGroupReportQuery({
    id: id!,
    ...range,
  });
  const { data: payoutsData } = useGetGroupPaymentsQuery({ groupId: id!, ...range });

  const [inviteUser, { isLoading: inviting }] = useInviteUserMutation();
  const [updateGroup, { isLoading: savingSettings }] = useUpdateGroupMutation();
  const [makePayment, { isLoading: paying }] = useMakePaymentMutation();

  const group = groupData?.data?.group;
  const isManager = group && user && group.manager === user._id;
  const members = membersData?.data?.members || [];
  const payouts = payoutsData?.data?.payments || [];


  if (groupLoading || membersLoading) {
    return (
      <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
        <div className="skeleton h-9 w-64" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-muted">{t('group.not_found')}</p>
          <button onClick={() => navigate('/groups')} className="btn-ghost mt-5">
            <ArrowLeft size={16} />
            {t('groups.title')}
          </button>
        </div>
      </main>
    );
  }

  const handleInvite = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      await inviteUser({ email: values.email, groupId: id! }).unwrap();
      toast.success(t('groups.invite_sent'));
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettings = async (values: any, { setSubmitting }: any) => {
    try {
      await updateGroup({
        id: id!,
        name: values.name,
        hourlyRate: Number(values.hourlyRate),
        budget: Number(values.budget),
      }).unwrap();
      toast.success(t('group.settings_saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayout = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const res = await makePayment({
        userId: values.userId,
        amount: Number(values.amount),
        groupId: id!,
        startDate: range.startDate,
        endDate: range.endDate,
        notes: values.notes || undefined,
      }).unwrap();
      toast.success(
        `${t('group.payout_done')} · ${t('group.payout_settled')} ${res.data.settledLogs}`
      );
      if (res.data.leftover > 0) {
        toast(t('group.payout_leftover') + ' ' + money(res.data.leftover));
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const totals = reportData?.data?.totals;
  const rows = reportData?.data?.reports || [];
  // Payout targets mirror the report so the select never disagrees with the table
  const payoutTargets =
    rows.length > 0
      ? rows.map((r: any) => ({ _id: r.userId, username: r.username }))
      : members.map((m: any) => ({ _id: m._id, username: m.username }));

  return (
    <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-ink"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{group.name}</h1>
            <p className="num mt-1 text-sm text-muted">
              {money(group.hourlyRate)}/{t('common.hr')}
              {group.budget > 0 && <> · {t('groups.budget').split('(')[0].trim()} {money(group.budget)}</>}
            </p>
          </div>
        </div>

        {/* Range control */}
        <JalaliDateRangePicker
          value={{ startDate: range.startDate, endDate: range.endDate }}
          onChange={(range) => setRange({ ...range })}
          label={t('group.report_range')}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Members */}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Users size={18} className="text-accent" />
              {t('groups.members_title')}
            </h2>
            <ul className="mt-4 space-y-2">
              {members.map((m: any) => (
                <li
                  key={m._id}
                  className="flex items-center justify-between rounded-xl bg-inset px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {m.username.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{m.username}</span>
                  </div>
                  {m._id === group.manager && (
                    <span className="badge bg-accent/10 text-accent">{t('groups.role_manager')}</span>
                  )}
                </li>
              ))}
            </ul>

            {isManager && (
              <Formik initialValues={{ email: '' }} validationSchema={InviteSchema} onSubmit={handleInvite}>
                {({ isSubmitting }) => (
                  <Form className="mt-5 border-t border-line pt-5">
                    <label className="label" htmlFor="invite-email">{t('groups.invite_title')}</label>
                    <Field
                      id="invite-email"
                      type="email"
                      name="email"
                      className="field mt-1.5"
                      placeholder="member@team.com"
                    />
                    <ErrorMessage name="email" component="p" className="mt-1.5 text-xs text-accent" />
                    <button
                      type="submit"
                      disabled={isSubmitting || inviting}
                      className="btn-primary mt-3 w-full"
                    >
                      <UserPlus size={16} />
                      {isSubmitting || inviting ? t('common.loading') : t('groups.invite_btn')}
                    </button>
                  </Form>
                )}
              </Formik>
            )}
          </section>

          {/* Settings (manager only) */}
          {isManager && (
            <section className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <Gear size={18} className="text-accent" />
                {t('group.settings')}
              </h2>
              <Formik
                enableReinitialize
                initialValues={{
                  name: group.name,
                  hourlyRate: group.hourlyRate,
                  budget: group.budget || 0,
                }}
                validationSchema={SettingsSchema}
                onSubmit={handleSettings}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-4 space-y-4">
                    <div>
                      <label className="label" htmlFor="s-name">{t('groups.group_name')}</label>
                      <Field id="s-name" name="name" className="field mt-1.5" />
                      <ErrorMessage name="name" component="p" className="mt-1.5 text-xs text-accent" />
                    </div>
                    <div>
                      <label className="label" htmlFor="s-rate">{t('groups.hourly_rate')}</label>
                      <Field id="s-rate" type="number" step="0.5" name="hourlyRate" className="field mt-1.5 num" />
                      <ErrorMessage name="hourlyRate" component="p" className="mt-1.5 text-xs text-accent" />
                    </div>
                    <div>
                      <label className="label" htmlFor="s-budget">{t('groups.budget')}</label>
                      <Field id="s-budget" type="number" name="budget" className="field mt-1.5 num" />
                      <p className="mt-1.5 text-xs text-muted">{t('groups.budget_hint')}</p>
                      <ErrorMessage name="budget" component="p" className="mt-1.5 text-xs text-accent" />
                    </div>
                    <button type="submit" disabled={isSubmitting || savingSettings} className="btn-primary w-full">
                      {isSubmitting || savingSettings ? t('common.loading') : t('group.save_settings')}
                    </button>
                  </Form>
                )}
              </Formik>
            </section>
          )}

          {/* Payout form (manager only) */}
          {isManager && (
            <section className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <CurrencyCircleDollar size={18} className="text-accent" />
                {t('group.payout_title')}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{t('group.payout_desc')}</p>
              <Formik
                initialValues={{ userId: '', amount: '', notes: '' }}
                validationSchema={PayoutSchema}
                onSubmit={handlePayout}
              >
                {({ isSubmitting, setFieldValue, values }) => {
                  const row = rows.find((r: any) => r.userId === values.userId);
                  return (
                    <Form className="mt-4 space-y-4">
                      <div>
                        <label className="label" htmlFor="p-member">{t('group.member')}</label>
                        <Field as="select" id="p-member" name="userId" className="field mt-1.5">
                          <option value="">{t('group.select_member')}</option>
                          {payoutTargets.map((m: any) => (
                            <option key={m._id} value={m._id}>
                              {m.username}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="userId" component="p" className="mt-1.5 text-xs text-accent" />
                      </div>

                      {row && (
                        <div className="num flex justify-between rounded-xl bg-inset px-4 py-3 text-sm">
                          <span className="text-muted">{t('group.owed_summary')}</span>
                          <span className="num font-semibold text-ink">{money(row.totalAmount)}</span>
                          <span className="text-muted">
                            {t('groups.report_table_remaining')} {money(row.remainingAmount)}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="label" htmlFor="p-amount">{t('group.payout_amount')}</label>
                        <Field
                          id="p-amount"
                          type="number"
                          step="0.01"
                          name="amount"
                          className="field mt-1.5 num"
                          placeholder="0.00"
                        />
                        <ErrorMessage name="amount" component="p" className="mt-1.5 text-xs text-accent" />
                        {row && row.remainingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setFieldValue('amount', row.remainingAmount)}
                            className="mt-1.5 text-xs font-medium text-accent hover:underline"
                          >
                            {money(row.remainingAmount)}
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="label" htmlFor="p-notes">{t('group.payout_notes')}</label>
                        <Field id="p-notes" name="notes" className="field mt-1.5" placeholder={t('common.no_notes')} />
                        <ErrorMessage name="notes" component="p" className="mt-1.5 text-xs text-accent" />
                      </div>
                      <button type="submit" disabled={isSubmitting || paying} className="btn-primary w-full">
                        <Wallet size={16} />
                        {isSubmitting || paying ? t('common.loading') : t('group.payout_submit')}
                      </button>
                    </Form>
                  );
                }}
              </Formik>
            </section>
          )}
        </div>

        {/* Right column: report + payout history */}
        <div className="space-y-6">
          {/* Totals strip */}
          <div className="grid grid-cols-2 divide-line border-y border-line lg:grid-cols-4 lg:divide-x">
            {[
              { label: t('groups.report_table_hours'), value: `${fmtHours(totals?.totalHours)} ${t('common.hours_unit')}` },
              { label: t('group.owed_summary'), value: money(totals?.totalAmount) },
              { label: t('groups.report_table_paid'), value: money(totals?.paidAmount) },
              { label: t('group.remaining_summary'), value: money(totals?.remainingAmount) },
            ].map((s, i) => (
              <div key={s.label} className={`stat-tile lg:px-5 ${i % 2 === 1 ? 'ps-4 lg:ps-5' : ''}`}>
                <p className="text-xs text-muted">{s.label}</p>
                {reportLoading ? (
                  <div className="skeleton mt-1.5 h-6 w-20" />
                ) : (
                  <p className="num-display mt-0.5 text-lg font-semibold text-ink">{s.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Report table */}
          <section className="card-deep overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <ChartLineUp size={18} weight="light" className="text-accent" />
                {t('groups.report_title')}
              </h2>
              <span className="num text-xs text-muted">
                {range.startDate} → {range.endDate}
              </span>
            </div>

            {reportLoading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-11 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <ChartLineUp size={32} className="mx-auto text-muted/60" />
                <p className="mt-3 text-sm text-muted">{t('group.no_report')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head">{t('groups.report_table_member')}</th>
                      <th className="table-head">{t('groups.report_table_hours')}</th>
                      <th className="table-head">{t('groups.report_table_owed')}</th>
                      <th className="table-head">{t('groups.report_table_paid')}</th>
                      <th className="table-head">{t('groups.report_table_remaining')}</th>
                      <th className="table-head">{t('groups.report_table_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {rows.map((r: any) => (
                      <tr key={r.userId} className="transition-colors hover:bg-inset/60">
                        <td className="table-cell">
                          <span className="font-medium text-ink">{r.username}</span>
                          <span className="block text-xs text-muted">{r.email}</span>
                        </td>
                        <td className="table-cell num">{fmtHours(r.totalHours)}</td>
                        <td className="table-cell num font-semibold text-ink">{money(r.totalAmount)}</td>
                        <td className="table-cell num text-muted">{money(r.paidAmount)}</td>
                        <td className="table-cell num">
                          <span className={r.remainingAmount > 0 ? 'text-accent font-semibold' : 'text-muted'}>
                            {money(r.remainingAmount)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge ${
                              r.status === 'Exact'
                                ? 'bg-success/15 text-success'
                                : r.status === 'Overpaid'
                                ? 'bg-warn/15 text-warn'
                                : 'bg-accent/10 text-accent'
                            }`}
                          >
                            {r.status === 'Exact'
                              ? t('groups.status_exact')
                              : r.status === 'Overpaid'
                              ? t('groups.status_overpaid')
                              : t('groups.status_underpaid')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Payout history */}            <section className="card-deep overflow-hidden">
            <div className="border-b border-line/70 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <Wallet size={18} weight="light" className="text-accent" />
                {t('group.payouts_history')}
              </h2>
            </div>
            {payouts.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">{t('group.no_payouts')}</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {payouts.map((p: any) => (
                  <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                    <div className="text-sm">
                      <span className="font-medium text-ink">
                        {t('group.paid_to')} {p.user?.username || 'N/A'}
                      </span>
                      <span className="block text-xs text-muted">
                        {shortDate(p.date)}
                        {p.notes ? ` · ${p.notes}` : ''}
                      </span>
                    </div>
                    <span className="num-display font-semibold text-accent">{money(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default GroupDetailPage;
