import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MagnifyingGlass,
  ArrowRight,
  ArrowSquareOut,
  WarningCircle,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import { useLanguage } from '../hooks/useLanguage';
import { useSearchWebMutation } from '../store/api/apiSlice';
import { Reveal, KineticHeading } from '../components/motion/kinetics';

/**
 * Web search feature. The Exa call happens on the server (the /api/search
 * route); this page only sends a query and renders what comes back. The Exa
 * key never reaches the browser.
 */
const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [runSearch, { data, isLoading, error }] = useSearchWebMutation();

  const results = data?.data.results ?? [];
  const errorMessage = (error as any)?.data?.message as string | undefined;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSubmitted(q);
    await runSearch({ q });
  };

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />

      {/* Header + search form */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.3)]">
            <GlobeHemisphereWest size={22} weight="bold" />
          </span>
          <KineticHeading
            level={1}
            text={t('search.title')}
            className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
            accentWords={[0]}
          />
        </div>
        <p className="mt-2 max-w-2xl text-muted leading-relaxed sm:text-lg">
          {t('search.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="search-query">{t('search.placeholder')}</label>
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="field !ps-10"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-primary justify-center !px-6 !py-3"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                {t('search.searching')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t('search.search_btn')}
                <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Results area */}
      <section className="relative z-10 mt-8 max-w-3xl">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Reveal>
            <div className="card-deep flex items-start gap-3 p-6" role="alert">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <WarningCircle size={22} weight="bold" />
              </span>
              <div>
                <p className="font-semibold text-ink">{t('search.error_title')}</p>
                <p className="mt-1 text-sm text-muted">
                  {errorMessage || t('search.error')}
                </p>
              </div>
            </div>
          </Reveal>
        ) : data && results.length === 0 ? (
          <Reveal>
            <div className="px-5 py-14 text-center">
              <MagnifyingGlass size={34} className="mx-auto text-muted/60" />
              <p className="mt-3 text-sm text-muted">
                {t('search.no_results')} “{submitted}”
              </p>
            </div>
          </Reveal>
        ) : data ? (
          <div className="space-y-3">
            <p className="num text-xs text-muted">
              {results.length} {t('search.results_for')} “{data.data.query}”
            </p>
            {results.map((r, i) => (
              <Reveal key={`${r.url}-${i}`} delay={i * 0.04}>
                <article className="card-deep p-5 transition-colors hover:bg-inset/40">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-3"
                  >
                    <h3 className="font-semibold text-ink transition-colors group-hover:text-accent">
                      {r.title || r.url}
                    </h3>
                    <ArrowSquareOut size={16} className="mt-1 shrink-0 text-muted group-hover:text-accent" />
                  </a>
                  <p className="mt-1 truncate text-xs text-muted">{r.url}</p>
                  {r.highlights.length > 0 && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {r.highlights[0]}
                    </p>
                  )}
                  {(r.author || r.publishedDate) && (
                    <p className="mt-3 text-xs text-muted">
                      {r.author}
                      {r.author && r.publishedDate ? ' · ' : ''}
                      {r.publishedDate ? String(r.publishedDate).slice(0, 10) : ''}
                    </p>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-line/50 bg-inset/40 p-5">
            <p className="text-sm text-muted">{t('search.hint')}</p>
          </div>
        )}
      </section>

      <footer className="relative z-10 mt-16 border-t border-line/70 pt-6">
        <p className="text-xs text-muted">
          {t('search.powered_by')}{' '}
          <a
            href="https://exa.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Exa
          </a>
        </p>
        <p className="mt-1 text-xs text-muted">
          <Link to="/dashboard" className="hover:text-ink transition-colors">
            {t('nav.dashboard')}
          </Link>
        </p>
      </footer>
    </main>
  );
};

export default SearchPage;
