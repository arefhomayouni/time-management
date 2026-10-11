import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import { useUpdateMeMutation } from '../store/api/apiSlice';
import { useCalendar } from '../hooks/useCalendar';
import { TiltCard, staggerContainer, staggerItem, EASE_OUT } from '../components/motion/kinetics';
import { moneyByRateCurrency } from '../utils/format';
import type { RateCurrency } from '../store/slices/authSlice';

const ProfileSchema = Yup.object().shape({
  username: Yup.string().min(3, 'At least 3 characters').required('Required'),
  email: Yup.string().email('Enter a valid email').required('Required'),
  personalRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    // Rial rates are in the millions; only USD is bounded by 10k.
    .when('personalRateCurrency', {
      is: 'irr',
      then: (s) => s.max(1_000_000_000_000, 'That looks too high'),
      otherwise: (s) => s.max(10000, 'That looks too high'),
    })
    .required('Required'),
  personalRateCurrency: Yup.string()
    .oneOf(['usd', 'irr'])
    .required('Required'),
});

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t, language } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const { formatDate } = useCalendar();
  const reduce = useReducedMotion();

  const handleSave = async (values: any, { setSubmitting }: any) => {
    try {
      const res = await updateMe({
        username: values.username,
        email: values.email,
        personalRate: Number(values.personalRate),
        personalRateCurrency: values.personalRateCurrency as RateCurrency,
      }).unwrap();
      dispatch(setUser(res.data.user));
      toast.success(t('profile.saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const initialRateCurrency: 'usd' | 'irr' = (user?.personalRateCurrency ?? 'usd') as 'usd' | 'irr';

  const ratePreview = (rate: number, currency: 'usd' | 'irr') =>
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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('profile.title')}</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost !py-2">
          <ArrowLeft size={16} />
          {t('profile.back_btn')}
        </button>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.12, 0.1)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8 grid max-w-4xl gap-6 md:grid-cols-[280px_1fr]"
      >
        {/* Identity card */}
        <motion.section variants={staggerItem}>
          <TiltCard max={7} className="h-full">
          <section className="card-deep h-full p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/10 text-3xl font-bold text-accent shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.2)] ring-1 ring-accent/20">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-semibold">{user?.username}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
          <span className="badge mt-3 bg-inset text-muted">
            {user?.role === 'manager' ? t('groups.role_manager') : t('groups.role_member')}
          </span>
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('profile.joined')}</dt>
              <dd className="num">
                {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('profile.rate')}</dt>
              <dd className="num tabular-nums">
                {ratePreview(user?.personalRate ?? 0, initialRateCurrency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('profile.status')}</dt>
              <dd className="font-medium text-success">{t('profile.active')}</dd>
            </div>
          </dl>
          </section>
          </TiltCard>
        </motion.section>

        {/* Edit form */}
        <motion.section variants={staggerItem}>
          <section className="card-deep h-full p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-semibold">
            <Pencil size={17} weight="light" className="text-accent" />
            {t('profile.edit_title')}
          </h2>

          <Formik
            enableReinitialize
            initialValues={{
              username: user?.username || '',
              email: user?.email || '',
              personalRate: user?.personalRate ?? 0,
              personalRateCurrency: initialRateCurrency,
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleSave}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="mt-6 space-y-5">
                <div>
                  <label className="label" htmlFor="pf-username">{t('auth.username')}</label>
                  <Field id="pf-username" name="username" className="field mt-1.5" />
                  <ErrorMessage name="username" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="pf-email">{t('auth.email')}</label>
                  <Field id="pf-email" type="email" name="email" className="field mt-1.5" />
                  <ErrorMessage name="email" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="pf-rate">{t('profile.rate')}</label>
                  <div className="mt-1.5 flex gap-2">
                    <Field id="pf-rate" type="number" step="0.5" name="personalRate" className="field num shrink-0 w-28" />
                    <div className="flex rounded-xl border border-line bg-inset overflow-hidden">
                      <label className="cursor-pointer flex items-center justify-center gap-1.5 px-2.5 text-xs font-medium tabular-nums transition-colors border-r border-line last:border-r-0 hover:bg-inset/60">
                        <input
                          type="radio"
                          name="personalRateCurrency"
                          value="usd"
                          checked={values.personalRateCurrency === 'usd'}
                          onChange={() => setFieldValue('personalRateCurrency', 'usd')}
                          className="peer sr-only"
                        />
                        <span className="peer-checked:text-ink peer-checked:text-accent peer-checked:bg-accent/10 peer-checked:shadow-[0_0_0_1px_rgb(var(--c-accent)/0.2)]">
                          {language === 'fa' ? 'دلار' : 'USD'}
                        </span>
                      </label>
                      <label className="cursor-pointer flex items-center justify-center gap-1.5 px-2.5 text-xs font-medium tabular-nums transition-colors hover:bg-inset/60">
                        <input
                          type="radio"
                          name="personalRateCurrency"
                          value="irr"
                          checked={values.personalRateCurrency === 'irr'}
                          onChange={() => setFieldValue('personalRateCurrency', 'irr')}
                          className="peer sr-only"
                        />
                        <span className="peer-checked:text-ink peer-checked:text-accent peer-checked:bg-accent/10 peer-checked:shadow-[0_0_0_1px_rgb(var(--c-accent)/0.2)]">
                          {language === 'fa' ? 'ریال' : 'IRR'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-muted tabular-nums">
                    {ratePreview(Number(values.personalRate) || 0, values.personalRateCurrency)}/{t('common.hr')}
                  </p>
                  <ErrorMessage name="personalRate" component="p" className="mt-1.5 text-xs text-accent" />
                  <ErrorMessage name="personalRateCurrency" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary px-6 py-3">
                  {isSubmitting || isLoading ? t('common.loading') : t('profile.save_btn')}
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

export default ProfilePage;
