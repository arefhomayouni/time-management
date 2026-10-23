import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Clock } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { TiltCard, EASE_OUT } from "../components/motion/kinetics";
import { useLanguage } from "../hooks/useLanguage";
import { useLoginMutation } from "../store/api/apiSlice";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [login, { isLoading }] = useLoginMutation();
  const reduce = useReducedMotion();

  const from = (location.state as any)?.from || "/dashboard";

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: any,
  ) => {
    try {
      const response = await login(values).unwrap();
      dispatch(
        setCredentials({ token: response.token, user: response.data.user }),
      );
      toast.success(t("auth.login_success"));
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 pb-16 pt-10">
      <div className="aurora" aria-hidden="true" />
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        {/* Left: value copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="relative z-10 hidden md:block"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-ink">
            <Clock size={22} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {t("auth.login_title")}
          </h1>
          <p className="mt-3 max-w-[42ch] text-muted">
            {t("auth.login_subtitle")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ink">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t("home.c1_title")}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t("home.c4_title")}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t("home.c5_title")}
            </li>
          </ul>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
          className="stage-3d relative z-10"
        >
          <TiltCard max={5} className="w-full max-w-md justify-self-center">
            <div className="card elevated w-full p-7 sm:p-9">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("auth.login_title")}
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {t("auth.login_subtitle")}
              </p>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-7 space-y-4">
                    <div>
                      <label className="label" htmlFor="login-email">
                        {t("auth.email")}
                      </label>
                      <Field
                        id="login-email"
                        type="email"
                        name="email"
                        className="field mt-1.5"
                        placeholder="you@team.com"
                        autoComplete="email"
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="mt-1.5 text-xs text-accent"
                      />
                    </div>

                    <div>
                      <label className="label" htmlFor="login-password">
                        {t("auth.password")}
                      </label>
                      <Field
                        id="login-password"
                        type="password"
                        name="password"
                        className="field mt-1.5"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <ErrorMessage
                        name="password"
                        component="p"
                        className="mt-1.5 text-xs text-accent"
                      />
                      {/* Forgot password link */}
                      <div className="mt-2 flex justify-end">
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-accent transition-colors hover:underline"
                        >
                          {t("auth.forgot_link")}
                        </Link>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="btn-primary w-full py-3"
                    >
                      {isSubmitting || isLoading
                        ? t("common.loading")
                        : t("auth.login_btn")}
                    </button>
                  </Form>
                )}
              </Formik>

              <p className="mt-6 text-sm text-muted">
                {t("auth.no_account")}{" "}
                <Link
                  to="/register"
                  className="font-semibold text-accent hover:underline"
                >
                  {t("auth.create_link")}
                </Link>
              </p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </main>
  );
};

export default LoginPage;
