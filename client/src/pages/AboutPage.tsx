import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hexagon, Users, Calendar, CurrencyDollar, ShieldCheck, Clock, ArrowRight } from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { TiltCard, KineticHeading } from '../components/motion/kinetics';

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

const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
              <Link to="/about" className="hover:text-ink transition-colors">{t('about.about')}</Link>
              <span className="text-muted">/</span>
              <Link to="/contact" className="hover:text-ink transition-colors">{t('about.contact')}</Link>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-shell px-4 pb-20 pt-12 sm:px-6 md:pt-20">
          <Reveal className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.3)]">
                <Hexagon size={24} weight="bold" />
              </span>
              <KineticHeading
                level={1}
                text={t('about.title')}
                className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
                accentWords={[0]}
              />
            </div>
            <p className="mt-5 max-w-2xl text-muted leading-relaxed sm:text-lg">
              {t('about.subtitle')}
            </p>
          </Reveal>
        </section>

        {/* Mission */}
        <section className="relative z-10 border-t border-line/70 bg-surface/50 py-20">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('about.mission_title')}
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-6 max-w-4xl">
              <p className="text-lg leading-relaxed sm:text-xl text-muted">
                {t('about.mission')}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Values grid - colorful cards */}
        <section className="relative z-10 py-20">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('about.values_title')}
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Users size={24} weight="light" />, title: t('about.value1_title'), desc: t('about.value1_desc'), bg: '' },
                { icon: <Calendar size={24} weight="light" />, title: t('about.value2_title'), desc: t('about.value2_desc'), bg: '' },
                { icon: <CurrencyDollar size={24} weight="light" />, title: t('about.value3_title'), desc: t('about.value3_desc'), bg: '' },
                { icon: <ShieldCheck size={24} weight="light" />, title: t('about.value4_title'), desc: t('about.value4_desc'), bg: '' },
                { icon: <Clock size={24} weight="light" />, title: t('about.value5_title'), desc: t('about.value5_desc'), bg: '' },
                { icon: <Hexagon size={24} weight="light" />, title: t('about.value6_title'), desc: t('about.value6_desc'), bg: '' },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 0.05}>
                  <TiltCard max={7} className="h-full">
                    <div className={`card-deep h-full p-6 ${item.bg}`}>
                      <div className="flex items-center gap-3 text-accent mb-4">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent shadow-[0_2px_8px_-2px_rgb(var(--c-glow)/0.2)]">
                          {item.icon}
                        </span>
                        <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="relative z-10 border-t border-line/70 bg-surface/50 py-20">
          <div className="mx-auto max-w-shell px-4 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('about.team_title')}
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: t('about.team1_name'), role: t('about.team1_role'), bio: t('about.team1_bio'), initials: 'S' },
                { name: t('about.team2_name'), role: t('about.team2_role'), bio: t('about.team2_bio'), initials: 'A' },
                { name: t('about.team3_name'), role: t('about.team3_role'), bio: t('about.team3_bio'), initials: 'M' },
              ].map((member, i) => (
                <Reveal key={member.name} delay={i * 0.07}>
                  <TiltCard max={7} className="h-full">
                  <div className="card-deep h-full p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.2)] ring-1 ring-accent/20">
                      {member.initials}
                    </div>
                    <h3 className="text-lg font-semibold text-ink">{member.name}</h3>
                    <p className="text-sm text-accent font-medium">{member.role}</p>
                    <p className="mt-3 text-sm text-muted leading-relaxed">{member.bio}</p>
                  </div>
                  </TiltCard>
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
                  {t('about.cta_title')}
                </h2>
                <p className="mt-3 max-w-md text-center text-muted sm:text-left">
                  {t('about.cta_sub')}
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

export default AboutPage;
