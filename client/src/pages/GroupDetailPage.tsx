import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Users,
  EnvelopeSimple,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useGetGroupDetailsQuery, useUpdateGroupMutation, useGetGroupMembersQuery } from '../store/api/apiSlice';
import { useAppSelector } from '../store/hooks';
import { moneyByRateCurrency } from '../utils/format';
import { TiltCard, staggerContainer, staggerItem, EASE_OUT } from '../components/motion/kinetics';
import type { RateCurrency } from '../store/slices/authSlice';

const SettingsSchema = Yup.object().shape({
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
    .required('Required'),
  hourlyRateCurrency: Yup.string().oneOf(['usd', 'irr']).required('Required'),
});

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();
  const { data: groupData, isLoading: groupLoading, refetch } = useGetGroupDetailsQuery(id || '', { skip: !id });
  const { data: membersData } = useGetGroupMembersQuery(id || '', { skip: !id });
  const reduce = useReducedMotion();

  const group = (groupData?.data as any)?.group ?? null;
  const members = (membersData?.data as any)?.members ?? [];

  const handleSaveSettings = async (values: any, { setSubmitting }: any) => {
    if (!id) return;
    try {
      await updateGroup({
        id,
        name: values.name,
        hourlyRate: Number(values.hourlyRate),
        hourlyRateCurrency: values.hourlyRateCurrency as RateCurrency,
      }).unwrap();
      await refetch();
      toast.success(t('group.settings_saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const ratePreview = (rate: number, currency: RateCurrency) =>
    moneyByRateCurrency(rate, currency);

  const groupCurrency: RateCurrency = (group?.hourlyRateCurrency ?? 'usd') as RateCurrency;
  // The RTK query typed the response narrowly; assert the group shape we use.

  if (groupLoading) {
    return (
      <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
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
      <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
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
          <button onClick={() => navigate('/groups')} className="btn-ghost !py-1.5 mb-2">
            <ArrowLeft size={16} />
            {t('nav.back')}
          </button>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('group.settings')}</h1>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.12)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8 grid gap-6 md:grid-cols-[280px_1fr]"
      >
        {/* Side card */}
        <motion.section variants={staggerItem}>
          <TiltCard max={6} className="h-full">
            <section className="card-deep h-full p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.2)]">
                <CurrencyDollar size={26} weight="light" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{group.name}</h2>
              <div className="mt-2 text-xs text-muted">
                {t('groups.hourly_rate')} {ratePreview(group?.hourlyRate ?? 0, groupCurrency)}
              </div>
              <dl className="mt-6 space-y-3 border-t border-line pt-5 text-left text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t('groups.members_title')}</dt>
                  <dd className="num">{members?.length ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t('groups.group_created')}</dt>
                  <dd className="num">{t('groups.role_manager')}</dd>
                </div>
              </dl>
            </section>
          </TiltCard>
        </motion.section>

        {/* Settings form */}
        <motion.section variants={staggerItem}>
          <section className="card-deep h-full p-6 sm:p-8">
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
              }}
              validationSchema={SettingsSchema}
              onSubmit={handleSaveSettings}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className="mt-6 space-y-5">
                  <div>
                    <label className="label" htmlFor="g-name">{t('groups.group_name')}</label>
                    <Field id="g-name" name="name" className="field mt-1.5" />
                    <ErrorMessage name="name" component="p" className="mt-1.5 text-xs text-accent" />
                  </div>

                  <div>
                    <label className="label" htmlFor="s-rate">{t('groups.hourly_rate')}</label>
                    <div className="mt-1.5 flex gap-2">
                      <Field id="s-rate" type="number" step="0.5" name="hourlyRate" className="field num shrink-0 w-28" />
                      <div className="flex rounded-xl border border-line bg-inset overflow-hidden">
                        <label className="cursor-pointer flex items-center justify-center gap-1.5 px-2.5 text-xs font-medium tabular-nums transition-colors border-r border-line last:border-r-0 hover:bg-inset/60">
                          <input
                            type="radio"
                            name="hourlyRateCurrency"
                            value="usd"
                            checked={values.hourlyRateCurrency === 'usd'}
                            onChange={() => setFieldValue('hourlyRateCurrency', 'usd')}
                            className="peer sr-only"
                          />
                          <span className="peer-checked:text-ink peer-checked:text-accent peer-checked:bg-accent/10 peer-checked:shadow-[0_0_0_1px_rgb(var(--c-accent)/0.2)]">
                            {language === 'fa' ? 'دلار' : 'USD'}
                          </span>
                        </label>
                        <label className="cursor-pointer flex items-center justify-center gap-1.5 px-2.5 text-xs font-medium tabular-nums transition-colors hover:bg-inset/60">
                          <input
                            type="radio"
                            name="hourlyRateCurrency"
                            value="irr"
                            checked={values.hourlyRateCurrency === 'irr'}
                            onChange={() => setFieldValue('hourlyRateCurrency', 'irr')}
                            className="peer sr-only"
                          />
                          <span className="peer-checked:text-ink peer-checked:text-accent peer-checked:bg-accent/10 peer-checked:shadow-[0_0_0_1px_rgb(var(--c-accent)/0.2)]">
                            {language === 'fa' ? 'ریال' : 'IRR'}
                          </span>
                        </label>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted tabular-nums">
                      {ratePreview(Number(values.hourlyRate) || 0, values.hourlyRateCurrency)}/{t('common.hr')}
                    </p>
                    <ErrorMessage name="hourlyRate" component="p" className="mt-1.5 text-xs text-accent" />
                    <ErrorMessage name="hourlyRateCurrency" component="p" className="mt-1.5 text-xs text-accent" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || updating}
                    className="btn-primary px-6 py-3"
                  >
                    {isSubmitting || updating ? t('common.loading') : t('group.save_settings')}
                  </button>
                </Form>
              )}
            </Formik>
          </section>
        </motion.section>
      </motion.div>
    </main>
  );
};

export default GroupDetailPage;
