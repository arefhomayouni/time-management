import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import { ArrowLeft, UsersThree } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useCreateGroupMutation } from '../store/api/apiSlice';
import { moneyByRateCurrency } from '../utils/format';
import { groupSchema } from '../utils/groupSchema';
import CurrencyToggle from '../components/groups/CurrencyToggle';
import { EASE_OUT } from '../components/motion/kinetics';
import type { RateCurrency } from '../store/slices/authSlice';

/**
 * Dedicated create page. The groups list links here, so the flow has a real
 * URL (`/groups/new`) instead of a button that silently did nothing.
 */
const GroupCreatePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [createGroup, { isLoading }] = useCreateGroupMutation();

  const handleCreate = async (values: any, { setSubmitting }: any) => {
    try {
      const res: any = await createGroup({
        name: values.name.trim(),
        hourlyRate: Number(values.hourlyRate),
        hourlyRateCurrency: values.hourlyRateCurrency as RateCurrency,
        budget: values.budget ? Number(values.budget) : undefined,
      }).unwrap();
      toast.success(t('groups.group_created'));
      const id = res?.data?.group?._id;
      navigate(id ? `/groups/${id}` : '/groups');
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10"
      >
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="btn-ghost mb-3 !py-1.5"
        >
          <ArrowLeft size={16} />
          {t('nav.back')}
        </button>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
            <UsersThree size={20} weight="light" />
          </span>
          {t('groups.create_title')}
        </h1>
      </motion.div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT }}
        className="card-deep relative z-10 mt-8 max-w-2xl p-6 sm:p-8"
      >
        <Formik
          initialValues={{
            name: '',
            hourlyRate: '',
            hourlyRateCurrency: 'usd' as RateCurrency,
            budget: '',
          }}
          validationSchema={groupSchema}
          onSubmit={handleCreate}
        >
          {({ isSubmitting, values, setFieldValue, errors, touched }) => (
            <Form className="space-y-5" noValidate>
              <div>
                <label className="label" htmlFor="group-name">
                  {t('groups.group_name')}
                </label>
                <Field
                  id="group-name"
                  name="name"
                  autoComplete="off"
                  className="field mt-1.5"
                  placeholder={t('groups.name_placeholder')}
                />
                <ErrorMessage name="name" component="p" className="mt-1.5 text-xs text-accent" />
              </div>

              <div>
                <label className="label" htmlFor="group-rate">
                  {t('groups.hourly_rate')}
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Field
                    id="group-rate"
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    name="hourlyRate"
                    className={`field num max-w-[180px] ${
                      touched.hourlyRate && errors.hourlyRate ? 'border-accent' : ''
                    }`}
                    placeholder={values.hourlyRateCurrency === 'irr' ? '30000000' : '45'}
                  />
                  <CurrencyToggle
                    value={values.hourlyRateCurrency}
                    onChange={(currency) => setFieldValue('hourlyRateCurrency', currency)}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted tabular-nums">
                  {moneyByRateCurrency(Number(values.hourlyRate) || 0, values.hourlyRateCurrency)}
                  /{t('common.hr')} · {t('groups.rate_hint')}
                </p>
                <ErrorMessage name="hourlyRate" component="p" className="mt-1.5 text-xs text-accent" />
              </div>

              <div>
                <label className="label" htmlFor="group-budget">
                  {t('groups.budget')}
                </label>
                <Field
                  id="group-budget"
                  type="number"
                  step="any"
                  min="0"
                  name="budget"
                  className="field num mt-1.5 max-w-[220px]"
                  placeholder="0"
                />
                <p className="mt-1.5 text-xs text-muted">{t('groups.budget_hint')}</p>
                <ErrorMessage name="budget" component="p" className="mt-1.5 text-xs text-accent" />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary px-6 py-3">
                  {isSubmitting || isLoading ? t('common.loading') : t('groups.create_btn')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/groups')}
                  className="btn-ghost px-5 py-3"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </motion.section>
    </main>
  );
};

export default GroupCreatePage;
