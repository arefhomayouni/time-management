import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import { useUpdateMeMutation } from '../store/api/apiSlice';

const ProfileSchema = Yup.object().shape({
  username: Yup.string().min(3, 'At least 3 characters').required('Required'),
  email: Yup.string().email('Enter a valid email').required('Required'),
  personalRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    .max(10000, 'That looks too high')
    .required('Required'),
});

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const handleSave = async (values: any, { setSubmitting }: any) => {
    try {
      const res = await updateMe({
        username: values.username,
        email: values.email,
        personalRate: Number(values.personalRate),
      }).unwrap();
      dispatch(setUser(res.data.user));
      toast.success(t('profile.saved'));
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('profile.title')}</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost !py-2">
          <ArrowLeft size={16} />
          {t('profile.back_btn')}
        </button>
      </div>

      <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-[280px_1fr]">
        {/* Identity card */}
        <section className="card p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/15 text-3xl font-bold text-accent">
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
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('profile.status')}</dt>
              <dd className="font-medium text-success">{t('profile.active')}</dd>
            </div>
          </dl>
        </section>

        {/* Edit form */}
        <section className="card p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-semibold">
            <Pencil size={17} className="text-accent" />
            {t('profile.edit_title')}
          </h2>

          <Formik
            enableReinitialize
            initialValues={{
              username: user?.username || '',
              email: user?.email || '',
              personalRate: user?.personalRate ?? 0,
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleSave}
          >
            {({ isSubmitting }) => (
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
                  <Field id="pf-rate" type="number" step="0.5" name="personalRate" className="field mt-1.5 num" />
                  <p className="mt-1.5 text-xs text-muted">{t('profile.rate_hint')}</p>
                  <ErrorMessage name="personalRate" component="p" className="mt-1.5 text-xs text-accent" />
                </div>
                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary px-6 py-3">
                  {isSubmitting || isLoading ? t('common.loading') : t('profile.save_btn')}
                </button>
              </Form>
            )}
          </Formik>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
