import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from '../lib/toast';
import {
  Plus,
  Users,
  UserPlus,
  Check,
  X,
  ArrowRight,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import {
  useGetMyGroupsQuery,
  useGetMyInvitationsQuery,
  useHandleInvitationMutation,
} from '../store/api/apiSlice';
import { moneyByRateCurrency } from '../utils/format';
import { TiltCard, staggerContainer, staggerItem, EASE_OUT } from '../components/motion/kinetics';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * A single group summary card. Fully tappable on mobile (the whole card is
 * the link target) so a worker can jump into a group without hunting for the
 * small "Manage" button.
 */
const GroupCard: React.FC<{ group: any }> = ({ group: g }) => {
  const { t } = useLanguage();
  const currency = (g.hourlyRateCurrency || 'usd') as 'usd' | 'irr';
  const memberCount = Array.isArray(g.members) ? g.members.length : 0;

  return (
    <section className="card-deep flex h-full flex-col p-4 sm:p-5 row-tap">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-ink">{g.name}</h2>
          <span
            className={`badge mt-1.5 ${
              g.isManager ? 'bg-accent/10 text-accent' : 'bg-inset text-muted'
            }`}
          >
            {g.isManager ? t('groups.role_manager') : t('groups.role_member')}
          </span>
        </div>
        <div className="num shrink-0 text-end text-sm text-ink">
          {moneyByRateCurrency(g.hourlyRate, currency)}
          <span className="text-muted">/{t('common.hr')}</span>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">{t('groups.budget_short')}</dt>
          <dd className="num text-ink">
            {g.budget ? moneyByRateCurrency(g.budget, currency) : t('groups.no_budget')}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">{t('groups.members_title')}</dt>
          <dd className="num text-ink">{memberCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">{t('groups.rate_currency')}</dt>
          <dd className="text-ink">{currency === 'irr' ? 'IRR' : 'USD'}</dd>
        </div>
      </dl>

      {/* Full-card tap target on mobile; explicit button on desktop */}
      <div className="mt-auto flex items-center gap-2.5 pt-4">
        <Link
          to={`/groups/${g._id}`}
          className="btn-ghost inline-flex items-center gap-1.5 text-sm"
          aria-label={`${g.isManager ? t('groups.manage') : t('groups.view_details')}: ${g.name}`}
        >
          {g.isManager ? t('groups.manage') : t('groups.view_details')}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
};

/**
 * Groups overview: every group you belong to, plus invitations waiting for
 * an answer. Creating a group navigates to the dedicated /groups/new page;
 * managing one (members, settings, report, payouts) lives on its detail page.
 */
const GroupsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [answering, setAnswering] = useState<string | null>(null);

  const { data: groupsData, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const { data: invitationsData } = useGetMyInvitationsQuery();
  const [handleInvitation] = useHandleInvitationMutation();

  const groups = groupsData?.data || [];
  const invitations = invitationsData?.data?.invitations || [];

  const answerInvitation = async (
    invitationId: string,
    status: 'accepted' | 'declined'
  ) => {
    setAnswering(invitationId);
    try {
      await handleInvitation({ invitationId, status }).unwrap();
      toast.success(
        status === 'accepted' ? t('groups.inv_accepted') : t('groups.inv_declined')
      );
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setAnswering(null);
    }
  };

  return (
    <main className="relative mx-auto max-w-shell px-4 pb-20 pt-24 sm:px-6 page-top page-bottom">
      <div className="aurora" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('groups.title')}
          </h1>
          <p className="mt-1.5 text-muted">{t('groups.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/groups/new')}
          className="btn-primary flex items-center gap-2 !py-2.5 !px-5"
        >
          <Plus size={17} weight="bold" />
          {t('groups.create_btn')}
        </button>
      </motion.div>

      {/* Invitations waiting for an answer */}
      {invitations.length > 0 && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="relative z-10 mt-8"
          aria-labelledby="invitations-heading"
        >
          <h2
            id="invitations-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            {t('groups.invitations')}
          </h2>
          <div className="flex flex-col gap-3">
            {invitations.map((inv: any) => {
              const busy = answering === inv._id;
              return (
                <div
                  key={inv._id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                    <UserPlus size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {inv.group?.name || t('groups.invitations')}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {inv.fromUser?.username
                        ? t('groups.invited_by').replace('{name}', inv.fromUser.username)
                        : t('groups.invitation_pending')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => answerInvitation(inv._id, 'accepted')}
                      className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition-opacity disabled:opacity-60"
                    >
                      <Check size={13} weight="bold" />
                      {t('groups.accept')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => answerInvitation(inv._id, 'declined')}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
                    >
                      <X size={13} />
                      {t('groups.decline')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Groups grid - tablet+Desktop: grid, Mobile: cards */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mt-8"
      >
        {groupsLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)
        ) : groups.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-line/70 bg-inset/50 p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
              <Users size={24} />
            </div>
            <p className="mt-4 text-sm text-muted">{t('groups.no_groups')}</p>
            <Link to="/groups/new" className="btn-ghost mt-5 inline-flex">
              {t('groups.create_btn')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g: any) => {
              return (
                <motion.section key={g._id} variants={staggerItem} className="h-full">
                  {/* Tilt feels bad on touch; only wrap desktop cards. */}
                  {isMobile ? (
                    <GroupCard group={g} />
                  ) : (
                    <TiltCard max={5} className="h-full">
                      <GroupCard group={g} />
                    </TiltCard>
                  )}
                </motion.section>
              );
            })}
          </div>
        )}
      </motion.div>
    </main>
  );
};

export default GroupsPage;