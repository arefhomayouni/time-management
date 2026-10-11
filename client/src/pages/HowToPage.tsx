import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { AnimatePresence } from 'framer-motion';
import {
  TiltCard,
  KineticHeading,
  staggerContainer,
  staggerItem,
} from '../components/motion/kinetics';
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

const HowToPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  return (
    <main className="relative pt-24">
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
              <Link to="/how-to" className="hover:text-ink transition-colors">{t('about.how_to')}</Link>
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
                <span className="text-lg font-bold">{t('about.how_to')}</span>
              </span>
              <KineticHeading
                level={1}
                text={t('howto.title')}
                className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl"
                accentWords={[0]}
              />
            </div>
            <p className="mt-4 max-w-2xl text-muted leading-relaxed sm:text-lg">
              {t('howto.subtitle')}
            </p>
          </Reveal>
        </section>

        {/* Steps */}
        <section className="relative z-10 py-16">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <motion.div
              variants={staggerContainer(0.09)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-10 md:grid-cols-2 lg:grid-cols-4"
            >
              {(t('howto.steps') as unknown as any[]).map((step: any) => (
                <motion.div key={step.num} variants={staggerItem} className="h-full">
                  <TiltCard max={8} className="h-full">
                    <div className="card-deep h-fit p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-ink shadow-[0_2px_8px_-2px_rgb(var(--c-glow-secondary)/0.3)]">
                          {step.num}
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-ink">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Notes */}
        <section className="relative z-10 border-t border-line/70 bg-surface/50 py-16">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-8">
                {t('howto.note_title')}
              </h2>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                t('howto.note1'),
                t('howto.note2'),
                t('howto.note3'),
              ].map((note, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <div className="flex gap-3 p-4 rounded-xl bg-inset/50 border border-line/50">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
                      <Check size={12} weight="bold" />
                    </span>
                    <p className="text-sm text-muted leading-relaxed">{note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative z-10 py-16">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-8">
                {t('howto.faq_title')}
              </h2>
            </Reveal>
            <div className="grid gap-3">
              {[
                { q: t('howto.faq1_q'), a: t('howto.faq1_a') },
                { q: t('howto.faq2_q'), a: t('howto.faq2_a') },
                { q: t('howto.faq3_q'), a: t('howto.faq3_a') },
                { q: t('howto.faq4_q'), a: t('howto.faq4_a') },
                { q: t('howto.faq5_q'), a: t('howto.faq5_a') },
              ].map((item: any, i: number) => (
                <Reveal key={i} delay={i * 0.03}>
                  <div className="border border-line/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-inset/50"
                      aria-expanded={openFaq === i}
                    >
                      <span className="text-sm font-medium text-ink pr-4">{item.q}</span>
                      <span className={`flex shrink-0 text-accent transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 2h8v2H4V2zm0 6h8v2H4V8zm0 6h8v2H4v-2z" fill="currentColor"/>
                        </svg>
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden border-t border-line/50"
                        >
                          <p className="px-4 pb-4 pt-3 text-sm leading-relaxed text-muted">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 mx-auto max-w-shell px-4 pb-20 pt-12 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-accent/20 bg-accent/[0.04] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t('howto.cta_title')}
                </h2>
                <p className="mt-3 max-w-md text-center text-muted sm:text-left">
                  {t('howto.cta_sub')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary !px-6 !py-3">
                  {t('nav.start_free')}
                  <ArrowRight size={14} />
                </Link>
                <Link to="/contact" className="btn-ghost !px-6 !py-3">
                  {t('about.contact_btn')}
                </Link>
              </div>
            </div>
          </Reveal>
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

export default HowToPage;
