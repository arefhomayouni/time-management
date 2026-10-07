import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { UserPlus } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useRegisterMutation } from '../store/api/apiSlice';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().min(3, 'At least 3 characters').required('Username is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'At least 6 characters').required('Password is required'),
  personalRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    .max(10000, 'That looks too high')
    .required('Rate is required'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (
    values: { username: string; email: string; password: string; personalRate: number },
    { setSubmitting }: any
  ) => {
    try {
      const response = await register({ ...values, personalRate: Number(values.personalRate) }).unwrap();
      dispatch(setCredentials({ token: response.token, user: response.data.user }));
      toast.success(t('auth.register_success'));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 pb-16 pt-10">
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="hidden md:block">
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
        </div>

        <div className="card w-full max-w-md justify-self-center p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.register_title')}</h2>
          <p className="mt-1.5 text-sm text-muted">{t('auth.register_subtitle')}</p>

          <Formik
            initialValues={{ username: '', email: '', password: '', personalRate: 35 }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
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
                  <Field id="reg-rate" type="number" name="personalRate" className="field mt-1.5 num" placeholder="35" />
                  <p className="mt-1.5 text-xs text-muted">{t('auth.rate_hint')}</p>
                  <ErrorMessage name="personalRate" component="p" className="mt-1.5 text-xs text-accent" />
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
      </div>
    </main>
  );
};

export default RegisterPage;
