import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Vote,
  BarChart3,
  Lock,
  ShieldCheck,
  ExternalLink,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { electionService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import type { Candidate, Election } from '@/types';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

export function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [programCandidate, setProgramCandidate] = useState<Candidate | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [casting, setCasting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadElectionData() {
      try {
        setLoading(true);
        const electionData = await electionService.getElection(id!);
        if (!isMounted) return;
        setElection(electionData);

        if (electionData) {
          const candidatesData = await electionService.listCandidates(id!);
          if (!isMounted) return;
          setCandidates(candidatesData);

          if (user?.id) {
            const voterStatus = await electionService.getVoterStatus(id!, user.id);
            if (!isMounted) return;
            setHasVoted(voterStatus);
          }
        }
      } catch {
        if (isMounted) setElection(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadElectionData();
    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  const handleVote = async () => {
    if (!selectedCandidate || !id || !user?.id) return;
    setCasting(true);
    try {
      await electionService.castBallot(id, selectedCandidate.id, user.id);
      setHasVoted(true);
      setSelectedCandidate(null);
      setShowConfirm(false);
      addToast('success', 'Votre bulletin a été déposé dans l’urne en toute confidentialité.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Échec lors de l’enregistrement du vote.');
    } finally {
      setCasting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card className="p-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Scrutin introuvable ou supprimé.</p>
          <Link
            to="/elections"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux scrutins
          </Link>
        </Card>
      </div>
    );
  }

  const isOpen = election.status === 'open';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      <Link
        to="/elections"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-brand-600 dark:text-zinc-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux scrutins
      </Link>

      <header className="card-base p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            {election.title}
          </h1>
          <Badge variant={election.status === 'open' ? 'success' : election.status === 'closed' ? 'warning' : 'neutral'}>
            {election.status === 'open' ? 'Scrutin ouvert' : election.status === 'closed' ? 'Scrutin clos' : election.status}
          </Badge>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
          {election.description ?? 'Aucune description fournie.'}
        </p>

        <div className="flex items-center gap-3 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 px-4 py-3 rounded-lg border border-brand-200 dark:border-brand-900 w-full sm:w-fit">
          <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>Garantie d’anonymat : votre identité est dissociée de votre suffrage.</span>
        </div>
      </header>

      {hasVoted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                  Votre suffrage a été enregistré dans l’urne.
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Merci pour votre participation.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
          Candidatures validées ({candidates.length})
        </h2>
        <button
          type="button"
          onClick={() => navigate(`/elections/${election.id}/results`)}
          className="btn-secondary text-xs"
        >
          <BarChart3 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          {election.status === 'open' ? 'Résultats en direct' : 'Résultats officiels'}
        </button>
      </div>

      {!isOpen && !hasVoted && (
        <Card className="p-5">
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              Ce scrutin est actuellement <strong>{election.status}</strong>. Les votes ne sont pas ouverts.
            </span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {candidates.map((c, i) => {
          const isSelected = selectedCandidate?.id === c.id;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <Card
                interactive={isOpen && !hasVoted}
                onClick={() => isOpen && !hasVoted && setSelectedCandidate(c)}
                className={`h-full p-5 transition-colors ${
                  isSelected
                    ? 'border-2 border-brand-600 bg-brand-50/40 dark:bg-brand-950/20'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950 dark:bg-zinc-800 text-lg font-extrabold text-white">
                    {c.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                        {c.display_name}
                      </h3>
                      {isSelected && <Badge variant="brand">Sélectionné</Badge>}
                    </div>

                    {c.program_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgramCandidate(c);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> Consulter le programme
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isOpen && !hasVoted && selectedCandidate && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="btn-primary text-sm px-8 py-3.5"
          >
            <Vote className="h-4 w-4" /> Confirmer mon vote pour {selectedCandidate.display_name}
          </button>
        </motion.div>
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirmation définitive du vote">
        <div className="space-y-5">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
              Vous allez valider votre vote pour <strong>{selectedCandidate?.display_name}</strong>. Cette action est{' '}
              <strong>irréversible</strong> et votre choix reste strictement anonyme.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="button" onClick={() => void handleVote()} className="btn-primary flex-1" disabled={casting}>
              {casting ? 'Enregistrement…' : 'Voter définitivement'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!programCandidate}
        onClose={() => setProgramCandidate(null)}
        title={`Programme — ${programCandidate?.display_name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Consultez le document officiel et la profession de foi déposés par le candidat auprès de l’administration.
          </p>
          {programCandidate?.program_url && (
            <a
              href={programCandidate.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              <ExternalLink className="h-4 w-4" /> Ouvrir le document officiel
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}