import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { ShieldCheck } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { TiltCard, EASE_OUT } from "../components/motion/kinetics";
import { useLanguage } from "../hooks/useLanguage";
import {
  useCheckForgetCodeMutation,
  useResetPasswordMutation,
  useSendForgetCodeMutation,
} from "../store/api/apiSlice";

type Step = 1 | 2 | 3;

type Values = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

const EmailSchema = Yup.object().shape({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

const CodeSchema = Yup.object().shape({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  code: Yup.string()
    .matches(/^\d{6}$/, "The code has 6 digits")
    .required("The code is required"),
});

const PasswordSchema = Yup.object().shape({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  newPassword: Yup.string()
    .min(8, "Use at least 8 characters")
    .required("A new password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "The passwords do not match")
    .required("Confirm the new password"),
});

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const [sendCode, { isLoading: sending }] = useSendForgetCodeMutation();
  const [checkCode, { isLoading: checking }] = useCheckForgetCodeMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const [step, setStep] = useState<Step>(1);
  /** Short-lived token handed out by the API once the code checks out. */
  const [resetToken, setResetToken] = useState("");
  /** The API echoes the code back (no mailer is wired up yet). */
  const [issuedCode, setIssuedCode] = useState("");
  /** The address the recovery is running for, kept between steps. */
  const [email, setEmail] = useState("");

  const from = (location.state as any)?.from || "/login";

  const busy = sending || checking || resetting;

  const handleSubmit = async (
    values: Values,
    { setSubmitting, setFieldError }: any,
  ) => {
    try {
      if (step === 1) {
        const response = await sendCode({ email: values.email }).unwrap();
        setIssuedCode(response?.data?.code || "");
        setEmail(values.email);
        toast.success(t("auth.forgot_code_sent"));
        setStep(2);
      } else if (step === 2) {
        const response = await checkCode({
          email: values.email,
          code: values.code,
        }).unwrap();
        const token = response?.data?.token;
        if (!token) throw new Error("No reset token returned");
        setResetToken(token);
        setStep(3);
      } else {
        await resetPassword({
          email: values.email,
          newPassword: values.newPassword,
          token: resetToken,
        }).unwrap();
        toast.success(t("auth.forgot_success"));
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || t("common.error");
      toast.error(message);
      // Keep the user on the step that failed.
      if (step === 2 && /code/i.test(String(message))) {
        setFieldError("code", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const schema =
    step === 1 ? EmailSchema : step === 2 ? CodeSchema : PasswordSchema;

  const heading =
    step === 1
      ? t("auth.forgot_title")
      : step === 2
        ? t("auth.forgot_code_title")
        : t("auth.forgot_new_title");

  const subheading =
    step === 1
      ? t("auth.forgot_subtitle")
      : step === 2
        ? t("auth.forgot_code_subtitle").replace("{email}", email)
        : t("auth.forgot_new_subtitle");

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
            <ShieldCheck size={22} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {t("auth.forgot_title")}
          </h1>
          <p className="mt-3 max-w-[42ch] text-muted">
            {t("auth.forgot_subtitle")}
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
              {/* Step indicator */}
              <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
                {[1, 2, 3].map((n) => (
                  <li
                    key={n}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      n <= step ? "bg-accent" : "bg-line"
                    }`}
                    aria-current={n === step ? "step" : undefined}
                  />
                ))}
              </ol>

              <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
              <p className="mt-1.5 text-sm text-muted">{subheading}</p>

              <Formik
                initialValues={{
                  email: "",
                  code: "",
                  newPassword: "",
                  confirmPassword: "",
                }}
                validationSchema={schema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-7 space-y-4">
                    {step === 1 && (
                      <div>
                        <label className="label" htmlFor="forgot-email">
                          {t("auth.email")}
                        </label>
                        <Field
                          id="forgot-email"
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
                    )}

                    {step === 2 && (
                      <>
                        {issuedCode && (
                          <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm">
                            <span className="text-muted">
                              {t("auth.forgot_code_hint")}
                            </span>
                            <span className="num ms-2 text-base font-bold tracking-[0.3em] text-accent">
                              {issuedCode}
                            </span>
                          </div>
                        )}
                        <div>
                          <label className="label" htmlFor="forgot-code">
                            {t("auth.forgot_code_label")}
                          </label>
                          <Field
                            id="forgot-code"
                            type="text"
                            inputMode="numeric"
                            name="code"
                            className="field num mt-1.5 tracking-[0.3em]"
                            placeholder="000000"
                            maxLength={6}
                            autoComplete="one-time-code"
                          />
                          <ErrorMessage
                            name="code"
                            component="p"
                            className="mt-1.5 text-xs text-accent"
                          />
                        </div>
                        <p className="text-xs text-muted">
                          {t("auth.forgot_code_to").replace("{email}", email)}
                        </p>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div>
                          <label className="label" htmlFor="forgot-new-password">
                            {t("auth.forgot_new_label")}
                          </label>
                          <Field
                            id="forgot-new-password"
                            type="password"
                            name="newPassword"
                            className="field mt-1.5"
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          <ErrorMessage
                            name="newPassword"
                            component="p"
                            className="mt-1.5 text-xs text-accent"
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="forgot-confirm-password">
                            {t("auth.forgot_confirm_label")}
                          </label>
                          <Field
                            id="forgot-confirm-password"
                            type="password"
                            name="confirmPassword"
                            className="field mt-1.5"
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          <ErrorMessage
                            name="confirmPassword"
                            component="p"
                            className="mt-1.5 text-xs text-accent"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || busy}
                      className="btn-primary w-full py-3"
                    >
                      {isSubmitting || busy ? (
                        t("common.loading")
                      ) : step === 1 ? (
                        t("auth.forgot_email_btn")
                      ) : step === 2 ? (
                        t("auth.forgot_code_btn")
                      ) : (
                        t("auth.forgot_reset_btn")
                      )}
                    </button>

                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep((s) => (s - 1) as Step)}
                        className="w-full text-sm font-medium text-muted transition-colors hover:text-ink"
                      >
                        {t("common.back")}
                      </button>
                    )}
                  </Form>
                )}
              </Formik>

              <p className="mt-6 text-sm text-muted">
                {t("auth.have_account")}{" "}
                <Link
                  to="/login"
                  className="font-semibold text-accent hover:underline"
                >
                  {t("auth.login_link")}
                </Link>
              </p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
