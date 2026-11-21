import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, ChevronRight, Calendar, Clock, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { electionService } from '@/services';
import type { Election, ElectionStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';

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
    electionService.listElections().then((e) => {
      setElections(e);
      setLoading(false);
    });
  }, []);

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const descriptionText = e.description ?? '';
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||                         descriptionText.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || e.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [elections, search, activeTab]);

  return (
    <div className={`mx-auto max-w-6xl space-y-8 ${embedded ? 'px-0 py-2' : 'px-4 py-10 lg:px-8'}`}>
      {/* En-tête Glassmorphism */}
      {!embedded && (
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
              <Vote className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Scrutins & Élections</h1>
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Espace institutionnel de vote sécurisé. Anonymat garanti par chiffrement de bout en bout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 backdrop-blur-md w-fit">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Confidentialité absolue • Zéro traçabilité</span>
          </div>
        </div>
      </div>
      )}

      {/* Barre de contrôle & Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un scrutin officiel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all shadow-sm"
          />
        </div>

        <div className="flex w-full sm:w-auto gap-1.5 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-1.5 backdrop-blur-md text-sm font-medium border border-slate-200/60 dark:border-slate-800">
          {(['all', 'open', 'closed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'Tous les scrutins' : tab === 'open' ? 'En cours' : 'Clôturés'}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des élections */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-16 text-center">
          <Vote className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Aucun scrutin ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <AnimatePresence>
            {filteredElections.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card interactive className="h-full border border-white/40 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 rounded-3xl p-6">
                  <Link to={`/elections/${e.id}`} className="block h-full flex flex-col justify-between">
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{e.title}</h3>
                        <Badge variant={statusVariant[e.status]}>
                          {e.status === 'open' ? getTimeRemaining(e.closes_at) : e.status === 'closed' ? 'Clôturé' : e.status}
                        </Badge>
                      </div>
                      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {e.description ?? 'Scrutin officiel organisé par l\'administration.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mb-4">
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> Du {formatDate(e.opens_at)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" /> Au {formatDate(e.closes_at)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-brand-600 dark:text-brand-400 group">
                        <span className="group-hover:translate-x-1 transition-transform">{e.status === 'open' ? 'Accéder au vote' : 'Consulter les résultats'}</span>
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