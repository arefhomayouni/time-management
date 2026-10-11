import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Plus, Users, UserPlus, EnvelopeSimple } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useGetMyGroupsQuery, useCreateGroupMutation, useUpdateGroupMutation, useInviteUserMutation, useGetMyInvitationsQuery } from '../store/api/apiSlice';
import { money, moneyByRateCurrency } from '../utils/format';
import { TiltCard, staggerContainer, staggerItem, EASE_OUT } from '../components/motion/kinetics';

const GroupCreateSchema = Yup.object().shape({
  name: Yup.string().min(2, 'At least 2 characters').required('Name is required'),
  hourlyRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    // Rial rates are in the millions; only USD is bounded by 100k.
    .when('hourlyRateCurrency', {
      is: 'irr',
      then: (s) => s.max(1_000_000_000_000, 'That looks too high'),
      otherwise: (s) => s.max(100000, 'That looks too high'),
    })
    .required('Rate is required'),
  hourlyRateCurrency: Yup.string().oneOf(['usd', 'irr']).required('Required'),
});

const InviteSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

type RateCurrency = 'usd' | 'irr';

const GroupsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [showInvite, setShowInvite] = React.useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState('');

  const { data: groupsData, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const { data: invitationsData } = useGetMyInvitationsQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();
  const [inviteUser, { isLoading: inviting }] = useInviteUserMutation();

  const groups = groupsData?.data || [];
  const invitations = invitationsData?.data?.invitations || [];

  const handleCreate = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      await createGroup({
        name: values.name,
        hourlyRate: Number(values.hourlyRate),
        hourlyRateCurrency: values.hourlyRateCurrency,
        budget: values.budget ? Number(values.budget) : undefined,
      }).unwrap();
      toast.success(t('groups.group_created'));
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, values: any, { setSubmitting }: any) => {
    try {
      await updateGroup({
        id,
        name: values.name,
        hourlyRate: Number(values.hourlyRate),
        hourlyRateCurrency: values.hourlyRateCurrency,
        budget: values.budget ? Number(values.budget) : undefined,
      }).unwrap();
      toast.success(t('group.settings_saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (groupId: string, { setSubmitting }: any) => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteUser({ email: inviteEmail.trim(), groupId }).unwrap();
      toast.success(t('groups.invite_sent'));
      setInviteEmail('');
      setShowInvite(null);
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const ratePreview = (rate: number, currency: RateCurrency) =>
    moneyByRateCurrency(rate, currency);

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
      <div className="aurora" aria-hidden="true" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('groups.title')}</h1>
          <p className="mt-1.5 text-muted">{t('groups.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/groups/new')} className="btn-primary flex items-center gap-2 !py-2.5 !px-5">
          <Plus size={17} weight="bold" />
          {t('groups.create_btn')}
        </button>
      </motion.div>

      {/* Invitations strip */}
      {invitations.length > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="relative z-10 mt-8 flex flex-wrap gap-3"
        >
          {invitations.map((inv: any) => (
            <div key={inv._id} className="flex items-center gap-3 rounded-xl border border-line/70 bg-inset/50 px-4 py-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
                <UserPlus size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{inv.email}</p>
                <p className="text-xs text-muted">{inv.groupName}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    // accept handled by group detail page for now
                  }}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20"
                >
                  {t('groups.accept')}
                </button>
                <button
                  onClick={() => {}}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-muted hover:text-ink"
                >
                  {t('groups.decline')}
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Groups grid */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {groupsLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))
        ) : groups.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-line/70 bg-inset/50 p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
              <Users size={24} />
            </div>
            <p className="mt-4 text-sm text-muted">{t('groups.no_groups')}</p>
            <Link to="/groups/new" className="btn-ghost mt-5 inline-flex">
              {t('groups.create_btn')}
            </Link>
          </div>
        ) : (
          groups.map((g: any) => (
            <motion.section key={g._id} variants={staggerItem}>
              <TiltCard max={5}>
                <section className="card-deep h-full p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-ink">{g.name}</h2>
                      <p className="mt-1 text-xs text-muted">
                        {t('nav.logged_in_as')} {t('groups.role_manager')}
                      </p>
                    </div>
                    <div className="num tabular-nums text-sm text-ink">
                      {moneyByRateCurrency(g.hourlyRate, g.hourlyRateCurrency || 'usd')}
                      <span className="text-muted">/{t('common.hr')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-md border border-line/70 bg-inset text-[10px] font-medium">
                      {g.hourlyRateCurrency === 'irr' ? 'IRR' : 'USD'}
                    </span>
                    {g.budget ? `${money(g.budget)} ${t('groups.budget')}` : ''}
                  </div>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Link to={`/groups/${g._id}`} className="btn-ghost text-sm">
                      {t('groups.view_details')}
                    </Link>
                    <button
                      onClick={() => setShowInvite(showInvite === g._id ? null : g._id)}
                      className="btn-ghost text-sm"
                    >
                      {t('groups.invite_btn')}
                    </button>
                  </div>

                  {/* Inline invite form */}
                  {showInvite === g._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 border-t border-line/70 pt-4"
                    >
                      <Formik
                        initialValues={{ email: inviteEmail }}
                        validationSchema={InviteSchema}
                        onSubmit={(values, { setSubmitting }) => handleInvite(g._id, { setSubmitting })}
                      >
                        {({ isSubmitting, setFieldValue }) => (
                          <Form className="space-y-3">
                            <div>
                              <label className="label text-xs">{t('groups.invite_title')}</label>
                              <Field
                                type="email"
                                name="email"
                                className="field !w-full num"
                                placeholder="you@team.com"
                                value={inviteEmail}
                                onChange={(e: any) => { setInviteEmail(e.target.value); setFieldValue('email', e.target.value) }}
                              />
                              <ErrorMessage name="email" component="p" className="mt-1 text-xs text-accent" />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={isSubmitting || inviting}
                                className="btn-primary flex-1 py-2 !text-sm"
                              >
                                {inviting ? t('common.loading') : t('groups.invite_btn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowInvite(null)}
                                className="btn-ghost py-2 text-sm"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </motion.div>
                  )}
                </section>
              </TiltCard>
            </motion.section>
          ))
        )}
      </motion.div>
    </main>
  );
};

export default GroupsPage;
