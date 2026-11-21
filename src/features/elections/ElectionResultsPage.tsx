import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, Users, ShieldCheck } from 'lucide-react';
import { electionService } from '@/services';
import type { Candidate, Election, ElectionResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';

const chartColors = ['#7A1026', '#18181B', '#A31633', '#52525B', '#C91D40', '#71717A'];

export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [turnout, setTurnout] = useState({ voted: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [e, c, r, t] = await Promise.all([
          electionService.getElection(id),
          electionService.listCandidates(id),
          electionService.getResults(id),
          electionService.getTurnout(id),
        ]);
        if (!active) return;
        setElection(e);
        setCandidates(c);
        setResults(r);
        setTurnout(t);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsub = electionService.subscribeToResults(id, (newResults) => {
      setResults(newResults);
      void electionService.getTurnout(id).then(setTurnout);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <CardSkeleton />
      </div>
    );
  }
  if (!election) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card className="p-8 text-center">
          <p className="text-zinc-500">Scrutin introuvable.</p>
        </Card>
      </div>
    );
  }

  const chartData = candidates.map((c) => ({
    name: c.display_name.split(' ')[0],
    fullName: c.display_name,
    votes: results.find((r) => r.candidate_id === c.id)?.vote_count ?? 0,
  }));

  const totalVotes = chartData.reduce((sum, d) => sum + d.votes, 0);
  const turnoutPct = turnout.total > 0 ? Math.round((turnout.voted / turnout.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
      <Link
        to={`/elections/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-brand-600 dark:text-zinc-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux détails du scrutin
      </Link>

      <header className="card-base p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            {election.title}
          </h1>
          <Badge variant={election.status === 'open' ? 'success' : 'warning'}>
            {election.status === 'open' ? 'Résultats en direct' : 'Résultats définitifs'}
          </Badge>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Transparence totale : seuls les compteurs agrégés globaux sont affichés. Aucune traçabilité des électeurs n’est conservée.
        </p>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-950 dark:text-white text-sm">Participation au scrutin</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {turnout.voted} votants sur {turnout.total} électeurs inscrits
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
              {turnoutPct}%
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${turnoutPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-brand-600"
          />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white tabular-nums">
          Distribution des suffrages ({totalVotes} votes exprimés)
        </h2>
        <div className="flex gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'bar'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Histogramme
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'pie'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <PieChartIcon className="h-4 w-4" /> Répartition
          </button>
        </div>
      </div>

      <Card className="p-6">
        {totalVotes === 0 ? (
          <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Aucun suffrage n’a encore été enregistré pour ce scrutin.
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #27272a',
                  backgroundColor: '#09090b',
                  color: '#fff',
                  fontSize: 12,
                }}
                formatter={(value) => [`${value ?? 0} votes`, 'Suffrages']}
                labelFormatter={(l) => chartData.find((d) => d.name === l)?.fullName ?? String(l)}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
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
                {chartData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #27272a',
                  backgroundColor: '#09090b',
                  color: '#fff',
                  fontSize: 12,
                }}
                formatter={(value) => [`${value ?? 0} votes`, 'Suffrages']}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
        <span>
          Garantie de non-traçabilité : le secret du vote est assuré par séparation cryptographique des tables électeurs et bulletins.
        </span>
      </div>
    </div>
  );
}