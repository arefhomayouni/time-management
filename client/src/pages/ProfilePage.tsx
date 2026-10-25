
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from '../lib/toast';
import {
  ArrowLeft,
  Pencil,
  LockKey,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import {
  useUpdateMeMutation,
  useChangePasswordMutation,
} from '../store/api/apiSlice';
import { useCalendar } from '../hooks/useCalendar';
import {
  TiltCard,
  staggerContainer,
  staggerItem,
  EASE_OUT,
} from '../components/motion/kinetics';
import { moneyByRateCurrency } from '../utils/format';
import type { RateCurrency } from '../store/slices/authSlice';

const ProfileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'At least 3 characters')
    .required('Required'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Required'),
  personalRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
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

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required')
    .test(
      'different-password',
      'New password must be different from your current password',
      function (value) {
        return !value || value !== this.parent.currentPassword;
      },
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t, language } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);

  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [changePassword, { isLoading: isPasswordLoading }] =
    useChangePasswordMutation();

  const { formatDate } = useCalendar();
  const reduce = useReducedMotion();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handlePasswordChange = async (
    values: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    { resetForm, setSubmitting }: any,
  ) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      resetForm();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast.success(
        language === 'fa'
          ? 'رمز عبور با موفقیت تغییر کرد'
          : 'Password changed successfully',
      );
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          (language === 'fa'
            ? 'تغییر رمز عبور ناموفق بود'
            : 'Failed to change password'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const initialRateCurrency: 'usd' | 'irr' =
    (user?.personalRateCurrency ?? 'usd') as 'usd' | 'irr';

  const ratePreview = (rate: number, currency: 'usd' | 'irr') =>
    moneyByRateCurrency(rate, currency);

  const passwordFields = [
    {
      name: 'currentPassword',
      label: language === 'fa' ? 'رمز عبور فعلی' : 'Current password',
      visible: showCurrentPassword,
      toggle: () => setShowCurrentPassword((v) => !v),
    },
    {
      name: 'newPassword',
      label: language === 'fa' ? 'رمز عبور جدید' : 'New password',
      visible: showNewPassword,
      toggle: () => setShowNewPassword((v) => !v),
    },
    {
      name: 'confirmPassword',
      label: language === 'fa' ? 'تکرار رمز عبور جدید' : 'Confirm new password',
      visible: showConfirmPassword,
      toggle: () => setShowConfirmPassword((v) => !v),
    },
  ] as const;

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10 flex items-center justify-between"
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('profile.title')}
        </h1>

        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost !py-2"
        >
          <ArrowLeft size={16} />
          {t('profile.back_btn')}
        </button>
      </motion.div>

      {/* Existing profile and edit form */}
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

              <h2 className="mt-4 text-lg font-semibold">
                {user?.username}
              </h2>
              <p className="text-sm text-muted">{user?.email}</p>

              <span className="badge mt-3 bg-inset text-muted">
                {user?.role === 'manager'
                  ? t('groups.role_manager')
                  : t('groups.role_member')}
              </span>

              <dl className="mt-6 space-y-3 border-t border-line pt-5 text-left text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('profile.joined')}</dt>
                  <dd className="num">
                    {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('profile.rate')}</dt>
                  <dd className="num tabular-nums">
                    {ratePreview(user?.personalRate ?? 0, initialRateCurrency)}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('profile.status')}</dt>
                  <dd className="font-medium text-success">
                    {t('profile.active')}
                  </dd>
                </div>
              </dl>
            </section>
          </TiltCard>
        </motion.section>

        {/* Edit profile form */}
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
                    <label className="label" htmlFor="pf-username">
                      {t('auth.username')}
                    </label>
                    <Field
                      id="pf-username"
                      name="username"
                      className="field mt-1.5"
                    />
                    <ErrorMessage
                      name="username"
                      component="p"
                      className="mt-1.5 text-xs text-accent"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="pf-email">
                      {t('auth.email')}
                    </label>
                    <Field
                      id="pf-email"
                      type="email"
                      name="email"
                      className="field mt-1.5"
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="mt-1.5 text-xs text-accent"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="pf-rate">
                      {t('profile.rate')}
                    </label>

                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <Field
                        id="pf-rate"
                        type="number"
                        step="0.5"
                        name="personalRate"
                        className="field num w-28 shrink-0"
                      />

                      <div className="flex overflow-hidden rounded-xl border border-line bg-inset">
                        <label className="flex cursor-pointer items-center justify-center border-r border-line px-2.5 text-xs font-medium transition-colors hover:bg-inset/60">
                          <input
                            type="radio"
                            name="personalRateCurrency"
                            value="usd"
                            checked={values.personalRateCurrency === 'usd'}
                            onChange={() =>
                              setFieldValue('personalRateCurrency', 'usd')
                            }
                            className="peer sr-only"
                          />
                          <span className="rounded-md px-1.5 py-1 peer-checked:bg-accent/10 peer-checked:text-accent">
                            {language === 'fa' ? 'دلار' : 'USD'}
                          </span>
                        </label>

                        <label className="flex cursor-pointer items-center justify-center px-2.5 text-xs font-medium transition-colors hover:bg-inset/60">
                          <input
                            type="radio"
                            name="personalRateCurrency"
                            value="irr"
                            checked={values.personalRateCurrency === 'irr'}
                            onChange={() =>
                              setFieldValue('personalRateCurrency', 'irr')
                            }
                            className="peer sr-only"
                          />
                          <span className="rounded-md px-1.5 py-1 peer-checked:bg-accent/10 peer-checked:text-accent">
                            {language === 'fa' ? 'ریال' : 'IRR'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <p className="mt-1.5 text-xs text-muted tabular-nums">
                      {ratePreview(
                        Number(values.personalRate) || 0,
                        values.personalRateCurrency,
                      )}
                      /{t('common.hr')}
                    </p>

                    <ErrorMessage
                      name="personalRate"
                      component="p"
                      className="mt-1.5 text-xs text-accent"
                    />
                    <ErrorMessage
                      name="personalRateCurrency"
                      component="p"
                      className="mt-1.5 text-xs text-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="btn-primary px-6 py-3"
                  >
                    {isSubmitting || isLoading
                      ? t('common.loading')
                      : t('profile.save_btn')}
                  </button>
                </Form>
              )}
            </Formik>
          </section>
        </motion.section>
      </motion.div>

      {/* Change password card */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative z-10 mt-6 max-w-4xl"
      >
        <section className="card-deep p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
              <LockKey size={21} weight="light" />
            </div>

            <div>
              <h2 className="font-semibold">
                {language === 'fa' ? 'تغییر رمز عبور' : 'Change password'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {language === 'fa'
                  ? 'برای امنیت حساب خود، رمز عبور فعلی را وارد کنید.'
                  : 'Update your password to keep your account secure.'}
              </p>
            </div>
          </div>

          <Formik
            initialValues={{
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordChange}
          >
            {({ isSubmitting }) => (
              <Form className="mt-6 grid gap-5 sm:grid-cols-2">
                {passwordFields.map((item, index) => (
                  <div
                    key={item.name}
                    className={index === 2 ? 'sm:col-span-2' : ''}
                  >
                    <label
                      className="label"
                      htmlFor={`pf-${item.name}`}
                    >
                      {item.label}
                    </label>

                    <div className="relative mt-1.5">
                      <Field
                        id={`pf-${item.name}`}
                        name={item.name}
                        type={item.visible ? 'text' : 'password'}
                        autoComplete={
                          item.name === 'currentPassword'
                            ? 'current-password'
                            : 'new-password'
                        }
                        className="field w-full pr-12"
                        placeholder={
                          language === 'fa'
                            ? 'رمز عبور را وارد کنید'
                            : 'Enter password'
                        }
                      />

                      <button
                        type="button"
                        onClick={item.toggle}
                        aria-label={
                          item.visible ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={item.visible}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted transition-colors hover:text-accent"
                      >
                        {item.visible ? (
                          <EyeSlash size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>

                    <ErrorMessage
                      name={item.name}
                      component="p"
                      className="mt-1.5 text-xs text-accent"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <p className="mb-4 text-xs text-muted">
                    {language === 'fa'
                      ? 'رمز عبور جدید باید حداقل ۸ کاراکتر داشته باشد.'
                      : 'Your new password must contain at least 8 characters.'}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting || isPasswordLoading}
                    className="btn-primary flex items-center justify-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LockKey size={17} />
                    {isSubmitting || isPasswordLoading
                      ? t('common.loading')
                      : language === 'fa'
                        ? 'تغییر رمز عبور'
                        : 'Update password'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
      </motion.section>
    </main>
  );
};

export default ProfilePage;
