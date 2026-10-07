import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Clock } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useLoginMutation } from '../store/api/apiSlice';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [login, { isLoading }] = useLoginMutation();

  const from = (location.state as any)?.from || '/dashboard';

  const handleSubmit = async (values: { email: string; password: string }, { setSubmitting }: any) => {
    try {
      const response = await login(values).unwrap();
      dispatch(setCredentials({ token: response.token, user: response.data.user }));
      toast.success(t('auth.login_success'));
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 pb-16 pt-10">
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        {/* Left: value copy */}
        <div className="hidden md:block">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-ink">
            <Clock size={22} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">{t('auth.login_title')}</h1>
          <p className="mt-3 max-w-[42ch] text-muted">{t('auth.login_subtitle')}</p>
          <ul className="mt-8 space-y-3 text-sm text-ink">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('home.c1_title')}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('home.c4_title')}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('home.c5_title')}
            </li>
          </ul>
        </div>

        {/* Right: form */}
        <div className="card w-full max-w-md justify-self-center p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.login_title')}</h2>
          <p className="mt-1.5 text-sm text-muted">{t('auth.login_subtitle')}</p>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="mt-7 space-y-4">
                <div>
                  <label className="label" htmlFor="login-email">{t('auth.email')}</label>
                  <Field
                    id="login-email"
                    type="email"
                    name="email"
                    className="field mt-1.5"
                    placeholder="you@team.com"
                    autoComplete="email"
                  />
                  <ErrorMessage name="email" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <div>
                  <label className="label" htmlFor="login-password">{t('auth.password')}</label>
                  <Field
                    id="login-password"
                    type="password"
                    name="password"
                    className="field mt-1.5"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <ErrorMessage name="password" component="p" className="mt-1.5 text-xs text-accent" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isSubmitting || isLoading ? t('common.loading') : t('auth.login_btn')}
                </button>
              </Form>
            )}
          </Formik>

          <p className="mt-6 text-sm text-muted">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              {t('auth.create_link')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
