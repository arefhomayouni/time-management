import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { UsersThree, Plus, ArrowRight, EnvelopeSimple, Check, X } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector } from '../store/hooks';
import {
  useGetMyGroupsQuery,
  useCreateGroupMutation,
  useGetMyInvitationsQuery,
  useHandleInvitationMutation,
} from '../store/api/apiSlice';
import { money } from '../utils/format';

const GroupSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Too short').required('Group name is required'),
  hourlyRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    .required('Rate is required'),
  budget: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    .nullable(),
});

const GroupsPage: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [showCreate, setShowCreate] = useState(false);

  const { data: groupsData, isLoading } = useGetMyGroupsQuery();
  const { data: invData } = useGetMyInvitationsQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [handleInvitation] = useHandleInvitationMutation();

  const groups = groupsData?.data || [];
  const invitations = invData?.data?.invitations || [];

  const handleCreate = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      await createGroup({
        name: values.name,
        hourlyRate: Number(values.hourlyRate),
        budget: values.budget ? Number(values.budget) : 0,
      }).unwrap();
      toast.success(t('groups.group_created'));
      resetForm();
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const respondInvite = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      await handleInvitation({ invitationId, status }).unwrap();
      toast.success(status === 'accepted' ? t('groups.inv_accepted') : t('groups.inv_declined'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
        <div className="skeleton h-9 w-48" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 w-full" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('groups.title')}</h1>
          <p className="mt-1.5 text-muted">{t('groups.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5">
          <Plus size={17} />
          {t('groups.create_btn')}
        </button>
      </div>

      {/* Invitations inbox */}
      {invitations.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
            <EnvelopeSimple size={16} className="text-accent" />
            {t('groups.invitations')}
          </h2>
          <div className="mt-3 space-y-2">
            {invitations.map((inv: any) => (
              <div
                key={inv._id}
                className="card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="text-sm">
                  <span className="font-semibold text-ink">{inv.group?.name}</span>
                  <span className="text-muted">
                    {' '}
                    · {t('groups.hourly_rate')} {money(inv.group?.hourlyRate)} · {t('nav.logged_in_as')}{' '}
                    {inv.fromUser?.username}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondInvite(inv._id, 'accepted')}
                    className="btn-primary !px-3 !py-1.5 !text-xs"
                  >
                    <Check size={14} />
                    {t('groups.accept')}
                  </button>
                  <button
                    onClick={() => respondInvite(inv._id, 'declined')}
                    className="btn-ghost !px-3 !py-1.5 !text-xs"
                  >
                    <X size={14} />
                    {t('groups.decline')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Group grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group: any) => {
          const isManager = group.manager === user?._id;
          return (
            <article key={group._id} className="card flex flex-col p-6 transition-colors hover:border-accent/40">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                  <UsersThree size={20} />
                </span>
                <span
                  className={`badge ${
                    isManager ? 'bg-accent/10 text-accent' : 'bg-inset text-muted'
                  }`}
                >
                  {isManager ? t('groups.role_manager') : t('groups.role_member')}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{group.name}</h3>
              <dl className="num mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t('groups.hourly_rate')}</dt>
                  <dd className="font-semibold">{money(group.hourlyRate)}</dd>
                </div>
                {group.budget > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t('groups.budget').split('(')[0].trim()}</dt>
                    <dd className="font-semibold">{money(group.budget)}</dd>
                  </div>
                )}
              </dl>
              <Link
                to={`/groups/${group._id}`}
                className="btn-ghost mt-5 w-full"
              >
                {t('groups.view_details')}
                <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </div>

      {groups.length === 0 && invitations.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <UsersThree size={36} className="mx-auto text-muted/60" />
          <p className="mt-4 text-sm text-muted">{t('groups.no_groups')}</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
            <Plus size={16} />
            {t('groups.create_btn')}
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="card relative w-full max-w-md p-7">
            <h2 className="text-xl font-semibold tracking-tight">{t('groups.create_title')}</h2>
            <Formik
              initialValues={{ name: '', hourlyRate: '', budget: '' }}
              validationSchema={GroupSchema}
              onSubmit={handleCreate}
            >
              {({ isSubmitting }) => (
                <Form className="mt-5 space-y-4">
                  <div>
                    <label className="label" htmlFor="g-name">{t('groups.group_name')}</label>
                    <Field id="g-name" name="name" className="field mt-1.5" placeholder="Nightshift Crew" />
                    <ErrorMessage name="name" component="p" className="mt-1.5 text-xs text-accent" />
                  </div>
                  <div>
                    <label className="label" htmlFor="g-rate">{t('groups.hourly_rate')}</label>
                    <Field
                      id="g-rate"
                      type="number"
                      step="0.5"
                      name="hourlyRate"
                      className="field mt-1.5 num"
                      placeholder="45"
                    />
                    <p className="mt-1.5 text-xs text-muted">{t('groups.rate_hint')}</p>
                    <ErrorMessage name="hourlyRate" component="p" className="mt-1.5 text-xs text-accent" />
                  </div>
                  <div>
                    <label className="label" htmlFor="g-budget">{t('groups.budget')}</label>
                    <Field
                      id="g-budget"
                      type="number"
                      name="budget"
                      className="field mt-1.5 num"
                      placeholder="5000"
                    />
                    <p className="mt-1.5 text-xs text-muted">{t('groups.budget_hint')}</p>
                    <ErrorMessage name="budget" component="p" className="mt-1.5 text-xs text-accent" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">
                      {t('common.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting || creating} className="btn-primary flex-1">
                      {isSubmitting || creating ? t('common.loading') : t('common.confirm')}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </main>
  );
};

export default GroupsPage;
