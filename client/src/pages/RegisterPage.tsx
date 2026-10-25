import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { UserPlus } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { TiltCard, EASE_OUT } from '../components/motion/kinetics';
import { useLanguage } from '../hooks/useLanguage';
import { useRegisterMutation } from '../store/api/apiSlice';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { moneyByRateCurrency } from '../utils/format';
import type { RateCurrency } from '../store/slices/authSlice';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().min(3, 'At least 3 characters').required('Username is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  // 8 characters is what the API enforces (auth/validation) - keeping the
  // client stricter here means a form that submits never comes back 400.
  password: Yup.string().min(8, 'At least 8 characters').required('Password is required'),
  personalRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    // USD rates are small; IRR rates are quoted in Rials (millions), so the
    // cap has to follow the selected currency or Rial entry is impossible.
    .when('personalRateCurrency', {
      is: 'irr',
      then: (s) => s.max(1_000_000_000_000, 'That looks too high'),
      otherwise: (s) => s.max(10000, 'That looks too high'),
    })
    .required('Rate is required'),
  personalRateCurrency: Yup.string().oneOf(['usd', 'irr']).required(),
});

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  personalRate: number;
  personalRateCurrency: RateCurrency;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t, language } = useLanguage();
  const [register, { isLoading }] = useRegisterMutation();
  const reduce = useReducedMotion();

  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting }: any
  ) => {
    try {
      const response = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        personalRate: Number(values.personalRate),
        personalRateCurrency: values.personalRateCurrency,
      }).unwrap();
      dispatch(setCredentials({ token: response.token, user: response.data.user }));
      toast.success(t('auth.register_success'));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const initialRateCurrency: 'usd' | 'irr' = 'usd';

  const ratePreview = (rate: number, currency: 'usd' | 'irr') =>
    moneyByRateCurrency(rate, currency);

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 pb-16 page-top">
      <div className="aurora" aria-hidden="true" />
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="relative z-10 hidden md:block"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-ink">
            <UserPlus size={22} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">{t('auth.register_title')}</h1>
          <p className="mt-3 max-w-[42ch] text-muted">{t('auth.register_subtitle')}</p>
          <div className="num mt-8 rounded-xl border border-line bg-inset p-5 text-sm">
            <p className="text-muted">{t('home.widget_monthly')}</p>
            <p className="mt-1 text-2xl font-semibold text-accent">$3,036.60</p>
            <p className="mt-1 text-xs text-muted">38 hrs/week × $35 × 4.33</p>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
          className="stage-3d relative z-10"
        >
          <TiltCard max={5} className="w-full max-w-md justify-self-center">
            <div className="card elevated w-full p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.register_title')}</h2>
          <p className="mt-1.5 text-sm text-muted">{t('auth.register_subtitle')}</p>

          <Formik<RegisterFormValues>
            initialValues={{ username: '', email: '', password: '', personalRate: 35, personalRateCurrency: initialRateCurrency }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="mt-7 space-y-4">
                <div>
                  <label className="label" htmlFor="reg-username">{t('auth.username')}</label>
                  <Field id="reg-username" name="username" className="field mt-1.5" placeholder="sahar.d" autoComplete="username" />
                  <ErrorMessage name="username" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="reg-email">{t('auth.email')}</label>
                  <Field id="reg-email" type="email" name="email" className="field mt-1.5" placeholder="you@team.com" autoComplete="email" />
                  <ErrorMessage name="email" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="reg-password">{t('auth.password')}</label>
                  <Field id="reg-password" type="password" name="password" className="field mt-1.5" placeholder="••••••••" autoComplete="new-password" />
                  <ErrorMessage name="password" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="reg-rate">{t('auth.personalRate')}</label>
                  <div className="mt-1.5 flex gap-2">
                    <Field id="reg-rate" type="number" name="personalRate" className="field num shrink-0 w-28" placeholder={language === 'fa' ? '۳۵' : '35'} />
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
                  </div>                    <p className="mt-1.5 text-xs text-muted tabular-nums">
                    {ratePreview(Number(values.personalRate) || 0, values.personalRateCurrency)}/{t('common.hr')}
                  </p>
                  <ErrorMessage name="personalRate" component="p" className="mt-1.5 text-xs text-accent" />
                  <ErrorMessage name="personalRateCurrency" component="p" className="mt-1.5 text-xs text-accent" />
                </div>

                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary w-full py-3">
                  {isSubmitting || isLoading ? t('common.loading') : t('auth.register_btn')}
                </button>
              </Form>
            )}
          </Formik>

          <p className="mt-6 text-sm text-muted">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              {t('auth.login_link')}
            </Link>
          </p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </main>
  );
};

export default RegisterPage;
