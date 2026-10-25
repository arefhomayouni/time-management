import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Envelope, Phone, MapPin, ArrowRight, Check } from '@phosphor-icons/react';
import { TiltCard, KineticHeading } from '../components/motion/kinetics';
import { useLanguage } from '../hooks/useLanguage';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate submission - in production, wire to a real endpoint
    await new Promise((r) => setTimeout(r, 600));
    setFormState('sent');
  };

  return (
    <main className="relative pt-24 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="app-shell">

        {/* Top bar */}
        <div className="relative z-10 border-b border-line/70">
          <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} />
              {t('common.back')}
            </button>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Link to="/contact" className="hover:text-ink transition-colors">{t('about.contact')}</Link>
              <span className="text-muted">/</span>
              <Link to="/about" className="hover:text-ink transition-colors">{t('about.about')}</Link>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-shell px-4 pb-16 pt-12 sm:px-6 md:pt-20">
          <Reveal className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary shadow-[0_4px_12px_-4px_rgb(var(--c-glow-secondary)/0.3)]">
                <Envelope size={22} weight="bold" />
              </span>
              <KineticHeading
                level={1}
                text={t('contact.title')}
                className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl"
                accentWords={[0]}
              />
            </div>
            <p className="mt-4 max-w-2xl text-muted leading-relaxed sm:text-lg">
              {t('contact.subtitle')}
            </p>
          </Reveal>
        </section>

        {/* Contact methods */}
        <section className="relative z-10 py-16">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-8">
                {t('contact.methods_title')}
              </h2>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Envelope size={24} weight="light" />,
                  label: t('contact.email_label'),
                  value: t('contact.email_value'),
                },
                {
                  icon: <Phone size={24} weight="light" />,
                  label: 'Phone',
                  value: '+1 (555) 000-0000',
                },
                {
                  icon: <MapPin size={24} weight="light" />,
                  label: 'Location',
                  value: 'Tehran · San Francisco · Remote-first',
                },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <TiltCard max={7} className="h-full">
                    <div className="card-deep flex h-full items-start gap-4 p-6">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-[0_2px_8px_-2px_rgb(var(--c-glow)/0.2)]">
                        {item.icon}
                      </span>
                      <div>
                        <p className="mb-1 text-xs text-muted">{item.label}</p>
                        <p className="text-sm font-medium text-ink">{item.value}</p>
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1} className="mt-6 px-4 py-3 rounded-xl bg-inset/50 border border-line/50">
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">{t('contact.response_time')}</span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* Contact form */}
        <section className="relative z-10 border-t border-line/70 bg-surface/50 py-16">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-8">
                {t('contact.form_title')}
              </h2>
            </Reveal>
            <Reveal delay={0.05} className="max-w-lg">
              {formState === 'sent' ? (
                <div className="card-deep p-8 text-center">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-success/10 text-success shadow-[0_4px_12px_-4px_rgb(0,0,0,0.1)]">
                    <Check size={28} weight="bold" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-ink">{t('contact.form_sent')}</p>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setFormState('idle')}
                      className="btn-ghost"
                    >
                      {t('common.reset') || 'Send another'}
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="card-deep p-6 sm:p-8 space-y-5"
                >
                  <div>
                    <label className="label" htmlFor="contact-name">{t('contact.form_name')}</label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      className="field mt-1.5"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-email">{t('contact.form_email')}</label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      className="field mt-1.5"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-message">{t('contact.form_message')}</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      className="field mt-1.5 resize-y"
                      placeholder="Tell us what you need help with..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="btn-primary btn-sheen w-full !py-3"
                  >
                    {formState === 'submitting' ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                        </svg>
                        {t('common.loading')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('contact.form_send')}
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-line/70 py-8">
          <div className="mx-auto flex max-w-shell flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} {process.env.REACT_APP_BRAND || 'TimeLuxe'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link to="/" className="text-muted transition-colors hover:text-accent">{t('home.eyebrow')}</Link>
              <Link to="/about" className="text-muted transition-colors hover:text-accent">{t('about.about')}</Link>
              <Link to="/contact" className="text-muted transition-colors hover:text-accent">{t('about.contact')}</Link>
              <Link to="/how-to" className="text-muted transition-colors hover:text-accent">{t('about.how_to')}</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default ContactPage;
