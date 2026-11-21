import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { electionService } from '@/services';
import type { Candidate, Election, ElectionResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';

const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [turnout, setTurnout] = useState({ voted: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [e, c, r, t] = await Promise.all([
        electionService.getElection(id),
        electionService.listCandidates(id),
        electionService.getResults(id),
        electionService.getTurnout(id),
      ]);
      setElection(e);
      setCandidates(c);
      setResults(r);
      setTurnout(t);
      setLoading(false);
    })();

    const unsub = electionService.subscribeToResults(id, (newResults) => {
      setResults(newResults);
      electionService.getTurnout(id).then(setTurnout);
    });
    return unsub;
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12"><CardSkeleton /></div>;
  if (!election) return <div className="mx-auto max-w-4xl px-4 py-12"><Card className="p-8 text-center rounded-3xl"><p className="text-slate-500">Scrutin introuvable.</p></Card></div>;

  const chartData = candidates.map((c) => ({
    name: c.display_name.split(' ')[0],
    fullName: c.display_name,
    votes: results.find((r) => r.candidate_id === c.id)?.vote_count ?? 0,
  }));

  const totalVotes = chartData.reduce((sum, d) => sum + d.votes, 0);
  const turnoutPct = turnout.total > 0 ? Math.round((turnout.voted / turnout.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8 space-y-8">
      <Link to={`/elections/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour aux détails du scrutin
      </Link>

      {/* En-tête des résultats */}
      <div className="rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{election.title}</h1>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <Badge variant={election.status === 'open' ? 'success' : 'warning'}>
            {election.status === 'open' ? 'Résultats en direct' : 'Résultats définitifs'}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Transparence médiévale garantie : seuls les compteurs agrégés globaux sont affichés. Aucune donnée nominative ou traçabilité des électeurs n'est conservée.
        </p>
      </div>

      {/* Taux de participation (Turnout) */}
      <Card className="rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-base">Participation au scrutin</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{turnout.voted} votants sur {turnout.total} électeurs inscrits</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold text-brand-600 dark:text-brand-400">{turnoutPct}%</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
          <motion.div initial={{ width: 0 }} animate={{ width: `${turnoutPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" />
        </div>
      </Card>

      {/* Sélecteur de Graphique & Titre */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          Distribution des suffrages ({totalVotes} votes exprimés)
        </h2>
        <div className="flex gap-1.5 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-1.5 backdrop-blur-md border border-slate-200/60 dark:border-slate-800">
          <button onClick={() => setChartType('bar')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <BarChart3 className="h-4 w-4" /> Histogramme
          </button>
          <button onClick={() => setChartType('pie')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${chartType === 'pie' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <PieChartIcon className="h-4 w-4" /> Répartition
          </button>
        </div>
      </div>

      {/* Affichage du Graphique */}
      <Card className="rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl shadow-slate-900/5">
        {totalVotes === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
            Aucun suffrage n'a encore été enregistré pour ce scrutin.
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 13, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value ?? 0} votes`, 'Suffrages']}
                labelFormatter={(l) => chartData.find((d) => d.name === l)?.fullName ?? String(l)}
              />
              <Bar dataKey="votes" radius={[12, 12, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="votes"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ name, votes }: { name?: string; votes?: number }) => `${name ?? ''} : ${votes ?? 0}`}
              >
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 13 }}
                formatter={(value) => [`${value ?? 0} votes`, 'Suffrages']} 
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 15 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Note de sécurité & de non-traçabilité */}
      <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        <span>Garantie de non-traçabilité : Le secret du vote est protégé par une signature cryptographique unidirectionnelle garantissant l'anonymat intégral des participants.</span>
      </div>
    </div>
  );
}