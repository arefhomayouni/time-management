import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  CurrencyCircleDollar,
  CalendarBlank,
  UsersThree,
  TrendUp,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { money, hours as fmtHours, monthRange } from '../utils/format';

/* ------------------------------------------------------------------
 * Hero widget: a REAL working mini time-entry (not a fake screenshot).
 * Click days to log hours, watch the pay math update live.
 * ----------------------------------------------------------------- */
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CYCLE = [0, 2, 4, 6, 8];

const WeekWidget: React.FC = () => {
  const { t } = useLanguage();
  const [days, setDays] = useState<number[]>([8, 8, 6.5, 8, 4, 0, 0]);
  const [rate, setRate] = useState(35);

  const totalH = useMemo(() => days.reduce((s, d) => s + d, 0), [days]);
  const totalPay = useMemo(() => totalH * rate, [totalH, rate]);

  const cycleDay = (i: number) =>
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i ? CYCLE[(CYCLE.indexOf(d) + 1) % CYCLE.length] : d
      )
    );

  return (
    <div className="card w-full p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {t('home.widget_this_week')}
          </p>
          <p className="mt-1 text-[13px] text-muted">{t('home.widget_hint')}</p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-semibold text-accent">{money(totalPay)}</p>
          <p className="num text-xs text-muted">
            {fmtHours(totalH)} {t('common.hours_unit')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 py-4 sm:gap-2">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => cycleDay(i)}
            aria-label={`${DAY_LABELS[i]}: ${d} ${t('common.hours_unit')}`}
            className={`group flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition-all active:translate-y-px sm:py-3 ${
              d > 0
                ? 'border-accent/40 bg-accent/10'
                : 'border-line bg-inset hover:border-accent/40'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
              {DAY_LABELS[i]}
            </span>
            <span
              className={`num text-[13px] font-semibold sm:text-sm ${
                d > 0 ? 'text-accent' : 'text-muted'
              }`}
            >
              {d > 0 ? fmtHours(d) : '0'}
            </span>
          </button>
        ))}
      </div>

      <label className="label" htmlFor="hero-rate">
        {t('home.widget_rate')}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          id="hero-rate"
          type="range"
          min={5}
          max={120}
          step={5}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-inset accent-accent"
        />
        <span className="num w-16 shrink-0 text-right text-sm font-semibold">
          {money(rate)}/{t('common.hr')}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-inset px-4 py-3">
        <span className="text-[13px] font-medium text-muted">
          {t('home.widget_monthly')}
        </span>
        <span className="num text-sm font-semibold">
          {money(totalPay * 4.33)}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeUp}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const range = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);

  const managerPoints = [t('home.m1'), t('home.m2'), t('home.m3'), t('home.m4')];
  const memberPoints = [t('home.u1'), t('home.u2'), t('home.u3'), t('home.u4')];

  return (
    <main className="pt-16">
      {/* ============ HERO: asymmetric split, copy left / live widget right ============ */}
      <section className="mx-auto grid max-w-shell items-center gap-10 px-4 pb-16 pt-14 sm:px-6 md:min-h-[calc(100dvh-4rem)] md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:pb-20 md:pt-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {t('home.eyebrow')}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t('home.hero_line1')}
            <br />
            <span className="text-accent">{t('home.hero_line2')}</span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">
            {t('home.hero_sub')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-[15px]">
              {t('nav.start_free')}
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-[15px]">
              {t('auth.login_btn')}
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-muted">{t('home.hero_note')}</p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <WeekWidget />
        </motion.div>
      </section>

      {/* ============ TWO SIDES: image-led split (family 2) ============ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 md:py-24">
          <Reveal className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('home.roles_title')}
            </h2>
            <p className="mt-3 max-w-[60ch] text-muted">{t('home.roles_sub')}</p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            {[
              {
                img: `${process.env.PUBLIC_URL}/images/manager.jpg`,
                title: t('home.manager_title'),
                desc: t('home.manager_desc'),
                points: managerPoints,
                icon: <UsersThree size={20} />,
              },
              {
                img: `${process.env.PUBLIC_URL}/images/member.jpg`,
                title: t('home.member_title'),
                desc: t('home.member_desc'),
                points: memberPoints,
                icon: <Clock size={20} />,
              },
            ].map((side, i) => (
              <Reveal key={side.title} delay={i * 0.08}>
                <article className="card h-full overflow-hidden">
                  <img
                    src={side.img}
                    alt=""
                    loading="lazy"
                    className="h-44 w-full object-cover sm:h-52"
                  />
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-2.5 text-accent">
                      {side.icon}
                      <h3 className="text-lg font-semibold text-ink">{side.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{side.desc}</p>
                    <ul className="mt-5 space-y-2.5">
                      {side.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-ink">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENTO: 5 cells, mixed backgrounds (family 3) ============ */}
      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('home.features_title')}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-12 md:gap-5">
          {/* 1: date filtering + preset chips */}
          <Reveal className="md:col-span-7">
            <div className="card flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2.5 text-accent">
                  <CalendarBlank size={22} />
                  <h3 className="font-semibold text-ink">{t('home.c1_title')}</h3>
                </div>
                <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
                  {t('home.c1_desc')}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  `${range.startDate} → ${range.endDate}`,
                  t('home.preset_30'),
                  t('home.preset_quarter'),
                  t('home.preset_year'),
                ].map((chip, i) => (
                  <span
                    key={i}
                    className={`badge border ${
                      i === 0
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-line bg-inset text-muted'
                    }`}
                  >
                    <span className="normal-case tracking-normal">{chip}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 2: real photo cell */}
          <Reveal delay={0.06} className="md:col-span-5">
            <div className="card h-full overflow-hidden">
              <img
                src={`${process.env.PUBLIC_URL}/images/detail.jpg`}
                alt=""
                loading="lazy"
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>
          </Reveal>

          {/* 3: accent math cell */}
          <Reveal delay={0.04} className="md:col-span-4">
            <div className="flex h-full flex-col justify-center rounded-2xl bg-accent p-6 text-accent-ink sm:p-8">
              <CurrencyCircleDollar size={30} />
              <p className="num mt-4 text-2xl font-semibold sm:text-3xl">8h × $35</p>
              <p className="num mt-1 text-3xl font-bold sm:text-4xl">= $280</p>
              <p className="mt-3 text-sm leading-relaxed opacity-90">{t('home.c3_desc')}</p>
            </div>
          </Reveal>

          {/* 4: rates */}
          <Reveal delay={0.1} className="md:col-span-4">
            <div className="card h-full p-6 sm:p-8">
              <div className="flex items-center gap-2.5 text-accent">
                <TrendUp size={22} />
                <h3 className="font-semibold text-ink">{t('home.c4_title')}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t('home.c4_desc')}</p>
              <div className="num mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-ink">{money(38)}</span>
                <span className="text-sm text-muted">/ {t('common.hr')}</span>
              </div>
            </div>
          </Reveal>

          {/* 5: trust */}
          <Reveal delay={0.14} className="md:col-span-4">
            <div className="card h-full bg-inset p-6 sm:p-8">
              <div className="flex items-center gap-2.5 text-accent">
                <ShieldCheck size={22} />
                <h3 className="font-semibold text-ink">{t('home.c5_title')}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t('home.c5_desc')}</p>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li>{t('home.c5_item1')}</li>
                <li>{t('home.c5_item2')}</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ REPORT PREVIEW: real table component (family 4) ============ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('home.report_title')}
            </h2>
            <p className="mt-3 max-w-[62ch] text-muted">{t('home.report_sub')}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card mt-8 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <span className="text-sm font-semibold text-ink">
                  {t('home.report_card_title')}
                </span>
                <span className="num text-xs text-muted">
                  {range.startDate} → {range.endDate}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head">{t('groups.report_table_member')}</th>
                      <th className="table-head">{t('groups.report_table_hours')}</th>
                      <th className="table-head">{t('groups.report_table_owed')}</th>
                      <th className="table-head">{t('groups.report_table_paid')}</th>
                      <th className="table-head">{t('groups.report_table_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {[
                      { name: 'Sahar Danesh', h: 42.5, owed: 1615.0, paid: 1615.0, s: 'exact' },
                      { name: 'Tomás Ferrer', h: 38.25, owed: 1453.5, paid: 900.0, s: 'under' },
                      { name: 'Mei-Ling Cho', h: 51.25, owed: 2152.5, paid: 1800.0, s: 'under' },
                      { name: 'Arman Vaziri', h: 29.75, owed: 1041.25, paid: 1200.0, s: 'over' },
                    ].map((r) => (
                      <tr key={r.name} className="transition-colors hover:bg-inset/60">
                        <td className="table-cell font-medium text-ink">{r.name}</td>
                        <td className="table-cell num text-muted">{fmtHours(r.h)}</td>
                        <td className="table-cell num font-semibold text-ink">{money(r.owed)}</td>
                        <td className="table-cell num text-muted">{money(r.paid)}</td>
                        <td className="table-cell">
                          <span
                            className={`badge ${
                              r.s === 'exact'
                                ? 'bg-success/15 text-success'
                                : r.s === 'over'
                                ? 'bg-warn/15 text-warn'
                                : 'bg-accent/10 text-accent'
                            }`}
                          >
                            {r.s === 'exact'
                              ? t('groups.status_exact')
                              : r.s === 'over'
                              ? t('groups.status_overpaid')
                              : t('groups.status_underpaid')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line px-5 py-3 text-xs text-muted">
                {t('home.report_sample_note')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA band (family 5) ============ */}
      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <div className="flex flex-col items-start gap-8 rounded-2xl border border-accent/25 bg-accent/[0.07] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('home.cta_title')}
              </h2>
              <p className="mt-3 max-w-[54ch] text-muted">{t('home.cta_sub')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-[15px]">
                {t('nav.start_free')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-shell flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {process.env.REACT_APP_BRAND || 'TimeLuxe'}
            </p>
            <p className="mt-1 text-sm text-muted">{t('home.footer_tagline')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Link to="/login" className="text-muted transition-colors hover:text-accent">
              {t('auth.login_btn')}
            </Link>
            <Link to="/register" className="text-muted transition-colors hover:text-accent">
              {t('nav.start_free')}
            </Link>
            <span className="text-muted">
              © {new Date().getFullYear()} {process.env.REACT_APP_BRAND || 'TimeLuxe'}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
