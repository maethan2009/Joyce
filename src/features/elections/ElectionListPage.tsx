import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, ChevronRight, Calendar, Clock, Search, ShieldCheck } from 'lucide-react';
import { electionService } from '@/services';
import type { Election, ElectionStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';

const statusVariant: Record<ElectionStatus, 'success' | 'warning' | 'neutral' | 'info'> = {
  draft: 'neutral',
  open: 'success',
  closed: 'warning',
  archived: 'neutral',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeRemaining(closesAt: string) {
  const diff = new Date(closesAt).getTime() - new Date().getTime();
  if (diff <= 0) return 'Scrutin clos';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}j restants`;
  return `${hours}h restantes`;
}

export function ElectionListPage({ embedded = false }: { embedded?: boolean }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    let active = true;
    electionService
      .listElections()
      .then((e) => {
        if (active) setElections(e);
      })
      .catch(() => {
        if (active) setElections([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const descriptionText = e.description ?? '';
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        descriptionText.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || e.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [elections, search, activeTab]);

  return (
    <div className={`mx-auto max-w-6xl space-y-6 ${embedded ? 'px-0 py-2' : 'px-4 py-8 lg:px-8'}`}>
      {!embedded && (
        <header className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-8 shadow-card">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Vote className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  Pilier 1 · Gouvernance Étudiante
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mt-0.5">
                  Scrutins &amp; Élections
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Vote institutionnel anonyme et vérifiable au sein de votre établissement.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit">
              <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>Anonymat garanti · Bulletin chiffré</span>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un scrutin officiel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>

        <div className="flex w-full sm:w-auto gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 text-xs font-semibold border border-zinc-200 dark:border-zinc-800">
          {(['all', 'open', 'closed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              {tab === 'all' ? 'Tous' : tab === 'open' ? 'En cours' : 'Clôturés'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredElections.length === 0 ? (
        <EmptyState
          title="Aucun scrutin disponible"
          description="Aucun scrutin ne correspond à vos critères ou aucun vote n’est ouvert pour votre établissement."
          icon={Vote}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {filteredElections.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Card interactive className="h-full p-6">
                  <Link to={`/elections/${e.id}`} className="h-full flex flex-col justify-between gap-4">
                    <div>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                          {e.title}
                        </h3>
                        <Badge variant={statusVariant[e.status]}>
                          {e.status === 'open'
                            ? getTimeRemaining(e.closes_at)
                            : e.status === 'closed'
                              ? 'Clôturé'
                              : e.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {e.description ?? 'Scrutin officiel organisé par l’administration.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3 mb-3 tabular-nums">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Du {formatDate(e.opens_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" /> Au {formatDate(e.closes_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-brand-600 dark:text-brand-400 group">
                        <span>{e.status === 'open' ? 'Accéder au vote' : 'Consulter les résultats'}</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}