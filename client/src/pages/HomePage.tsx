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
  Hexagon,
} from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { money, hours as fmtHours, monthRange } from '../utils/format';

/* =========================================================
 * HERO WIDGET — live time-entry, dual-currency.
 * Real math, no fake screenshots.
 * ========================================================= */
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
    <div className="card-deep w-full p-5 sm:p-6 shadow-[0_20px_50px_-20px_rgb(0,0,0,0.25)]">
      {/* Header: eyebrow + live total */}
      <div className="flex items-start justify-between gap-4 border-b border-line/70 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {t('home.widget_this_week')}
          </p>
          <p className="mt-1 text-[13px] text-muted">{t('home.widget_hint')}</p>
        </div>
        <div className="text-right">
          <p className="num-display text-2xl sm:text-3xl font-semibold text-ink">
            {money(totalPay, { currency: 'usd', dual: true })}
          </p>
          <p className="num mt-0.5 text-xs text-muted">
            {fmtHours(totalH)} {t('common.hours_unit')}
          </p>
        </div>
      </div>

      {/* Day grid: tactile day buttons */}
      <div className="grid grid-cols-7 gap-1.5 py-4 sm:gap-2">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => cycleDay(i)}
            aria-label={`${DAY_LABELS[i]}: ${d} ${t('common.hours_unit')}`}
            className={`group flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition-all duration-100 active:scale-[0.96] sm:py-3 ${
              d > 0
                ? 'border-accent/50 bg-accent/[0.06] text-accent shadow-[0_2px_8px_-2px_rgb(var(--c-glow)/0.2)]'
                : 'border-line/70 bg-inset/50 hover:border-accent/40 hover:bg-inset'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
              {DAY_LABELS[i]}
            </span>
            <span
              className={`num-display text-[14px] sm:text-sm font-semibold ${
                d > 0 ? 'text-ink' : 'text-muted'
              }`}
            >
              {d > 0 ? fmtHours(d) : '0'}
            </span>
          </button>
        ))}
      </div>

      {/* Rate slider */}
      <div className="mt-4 space-y-2">
        <label className="label" htmlFor="hero-rate">
          {t('home.widget_rate')}
        </label>
        <div className="flex items-center gap-3">
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
          <span className="num-display w-20 shrink-0 text-right text-sm font-semibold text-ink">
            {money(rate, { currency: 'usd', dual: true })}
            <span className="align-middle text-muted mx-1 text-xs">/{t('common.hr')}</span>
          </span>
        </div>
      </div>

      {/* Monthly projection strip */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-accent/5 border border-accent/15 px-4 py-3">
        <span className="text-[13px] font-medium text-muted">
          {t('home.widget_monthly')}
        </span>
        <span className="num-display text-base font-semibold text-accent">
          {money(totalPay * 4.33, { currency: 'usd', dual: true })}
        </span>
      </div>
    </div>
  );
};

/* =========================================================
 * REVEAL — scroll-entry motion. Heavier ease than before.
 * ========================================================= */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};  const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* =========================================================
 * HERO strip: clay tag, brand mark, CTAs.
 * ========================================================= */
const HeroStrip: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3">
      <Link to="/register" className="btn-primary !px-5 !py-2.5 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)]">
        {t('nav.start_free')}
        <ArrowRight size={14} />
      </Link>
      <Link to="/login" className="btn-ghost !py-2.5 !px-4 text-sm">
        {t('auth.login_btn')}
      </Link>
    </div>
  );
};

/* =========================================================
 * HOME PAGE — redesigned.
 * ========================================================= */
const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const range = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);

  const managerPoints = [t('home.m1'), t('home.m2'), t('home.m3'), t('home.m4')];
  const memberPoints = [t('home.u1'), t('home.u2'), t('home.u3'), t('home.u4')];

  return (
    <main className="relative">
      {/* Grain overlay — fixed, behind content */}
      <div className="grain" aria-hidden="true" />

      {/* ===== HERO: asymmetric split, copy left / widget right ===== */}
      <section className="relative z-10 mx-auto grid max-w-shell items-center gap-12 px-4 pb-20 pt-24 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:gap-16 lg:pt-28">
        {/* Left: copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          {/* Eyebrow: clay pill */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
              <Hexagon size={12} weight="bold" className="text-accent" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {t('home.eyebrow')}
            </p>
          </div>

          {/* Headline: massive, tight */}
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t('home.hero_line1')}
            <br />
            <span className="text-accent">{t('home.hero_line2')}</span>
          </h1>

          {/* Subtext */}
          <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg">
            {t('home.hero_sub')}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <HeroStrip />
          </div>

          {/* Note */}
          <p className="mt-5 text-[13px] text-muted">{t('home.hero_note')}</p>
        </motion.div>

        {/* Right: widget */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <WeekWidget />
        </motion.div>
      </section>

      {/* ===== ROLES: image-led split ===== */}
      <section className="relative z-10 border-t border-line/70 bg-surface/50">
        <div className="mx-auto max-w-shell px-4 py-20 sm:px-6 md:py-28">
          <Reveal className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('home.roles_title')}
            </h2>
            <p className="mt-3 max-w-[62ch] text-muted">{t('home.roles_sub')}</p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            {[
              {
                img: `${process.env.PUBLIC_URL}/images/manager.jpg`,
                title: t('home.manager_title'),
                desc: t('home.manager_desc'),
                points: managerPoints,
                icon: <UsersThree size={20} weight="light" />,
              },
              {
                img: `${process.env.PUBLIC_URL}/images/member.jpg`,
                title: t('home.member_title'),
                desc: t('home.member_desc'),
                points: memberPoints,
                icon: <Clock size={20} weight="light" />,
              },
            ].map((side, i) => (
              <Reveal key={side.title} delay={i * 0.07}>
                <article className="card-deep h-full overflow-hidden">
                  {/* Image with double-bezel: image fills, inner border on crop */}
                  <div className="relative overflow-hidden">
                    <img
                      src={side.img}
                      alt=""
                      loading="lazy"
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-56"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-2.5 text-accent">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                        {side.icon}
                      </span>
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

      {/* ===== BENTO: 5 cells, mixed backgrounds ===== */}
      <section className="relative z-10 mx-auto max-w-shell px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('home.features_title')}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-12 md:gap-5">
          {/* Cell 1: date range + preset chips (large) */}
          <Reveal className="md:col-span-7">
            <div className="card-deep flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2.5 text-accent">
                  <CalendarBlank size={22} weight="light" />
                  <h3 className="font-semibold text-ink">{t('home.c1_title')}</h3>
                </div>
                <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted">
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
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-line/70 bg-inset text-muted'
                    }`}
                  >
                    <span className="normal-case tracking-normal">{chip}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Cell 2: real photo (tall) */}
          <Reveal delay={0.06} className="md:col-span-5">
            <div className="card-deep h-full overflow-hidden">
              <img
                src={`${process.env.PUBLIC_URL}/images/detail.jpg`}
                alt=""
                loading="lazy"
                className="h-full min-h-[240px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent" />
            </div>
          </Reveal>

          {/* Cell 3: accent math — clay background */}
          <Reveal delay={0.04} className="md:col-span-4">
            <div className="flex h-full flex-col justify-center rounded-2xl bg-accent p-6 sm:p-8 shadow-[0_12px_32px_-10px_rgb(var(--c-glow)/0.35)]">
              <CurrencyCircleDollar size={28} weight="fill" className="text-accent-ink/80" />
              <p className="num-display mt-4 text-2xl font-semibold sm:text-3xl">
                8h × $35
              </p>
              <p className="num-display mt-1 text-3xl sm:text-4xl font-bold">
                = $280
              </p>
              <p className="mt-3 text-sm leading-relaxed opacity-90">{t('home.c3_desc')}</p>
            </div>
          </Reveal>

          {/* Cell 4: rate card */}
          <Reveal delay={0.1} className="md:col-span-4">
            <div className="card-deep h-full p-6 sm:p-8">
              <div className="flex items-center gap-2.5 text-accent">
                <TrendUp size={22} weight="light" />
                <h3 className="font-semibold text-ink">{t('home.c4_title')}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t('home.c4_desc')}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="num-display text-3xl sm:text-4xl font-semibold text-ink">
                  {money(38, { currency: 'usd', dual: true })}
                </span>
                <span className="text-sm text-muted">/ {t('common.hr')}</span>
              </div>
            </div>
          </Reveal>

          {/* Cell 5: trust, inset bg */}
          <Reveal delay={0.14} className="md:col-span-4">
            <div className="card-deep h-full bg-inset/50 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 text-accent">
                <ShieldCheck size={22} weight="light" />
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

      {/* ===== REPORT PREVIEW: real table ===== */}
      <section className="relative z-10 border-t border-line/70 bg-surface/50">
        <div className="mx-auto max-w-shell px-4 py-20 sm:px-6 md:py-28">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('home.report_title')}
            </h2>
            <p className="mt-3 max-w-[64ch] text-muted">{t('home.report_sub')}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card-deep mt-8 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
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
                    <tr className="border-b border-line/70">
                      <th className="table-head">{t('groups.report_table_member')}</th>
                      <th className="table-head">{t('groups.report_table_hours')}</th>
                      <th className="table-head">{t('groups.report_table_owed')}</th>
                      <th className="table-head">{t('groups.report_table_paid')}</th>
                      <th className="table-head">{t('groups.report_table_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/50">
                    {[
                      { name: 'Sahar Danesh', h: 42.5, owed: 1615.0, paid: 1615.0, s: 'exact' },
                      { name: 'Tomás Ferrer', h: 38.25, owed: 1453.5, paid: 900.0, s: 'under' },
                      { name: 'Mei-Ling Cho', h: 51.25, owed: 2152.5, paid: 1800.0, s: 'under' },
                      { name: 'Arman Vaziri', h: 29.75, owed: 1041.25, paid: 1200.0, s: 'over' },
                    ].map((r) => (
                      <tr key={r.name} className="transition-colors hover:bg-inset/60">
                        <td className="table-cell font-medium text-ink">{r.name}</td>
                        <td className="table-cell num text-muted">{fmtHours(r.h)}</td>
                        <td className="table-cell num font-semibold text-ink">
                          {money(r.owed, { currency: 'usd', dual: true })}
                        </td>
                        <td className="table-cell num text-muted">
                          {money(r.paid, { currency: 'usd', dual: true })}
                        </td>
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
              <p className="border-t border-line/70 px-5 py-3 text-xs text-muted">
                {t('home.report_sample_note')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== CTA band: clay-tinted ===== */}
      <section className="relative z-10 mx-auto max-w-shell px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <div className="flex flex-col items-start gap-8 rounded-2xl border border-accent/20 bg-accent/[0.04] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('home.cta_title')}
              </h2>
              <p className="mt-3 max-w-[56ch] text-muted">{t('home.cta_sub')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/register" className="btn-primary !px-6 !py-3 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)]">
                {t('nav.start_free')}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-line/70">
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
