import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Vote, BarChart3, Lock, ShieldCheck, ExternalLink, FileText, AlertTriangle } from 'lucide-react';
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
      } catch (error) {
        console.error('Erreur lors du chargement de l\'élection :', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadElectionData();
    return () => { isMounted = false; };
  }, [id, user?.id]);

  const handleVote = async () => {
    if (!selectedCandidate || !id || !user?.id) return;
    setCasting(true);
    try {
      await electionService.castBallot(id, selectedCandidate.id, user.id);
      setHasVoted(true);
      setSelectedCandidate(null);
      setShowConfirm(false);
      addToast('success', 'Votre bulletin chiffré a été déposé dans l’urne en toute confidentialité.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Échec lors de l’enregistrement du vote.');
    } finally {
      setCasting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <p className="text-slate-500 dark:text-slate-400 font-medium">Scrutin introuvable ou supprimé.</p>
          <Link to="/elections" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour aux scrutins
          </Link>
        </Card>
      </div>
    );
  }

  const isOpen = election.status === 'open';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8 space-y-8">
      <Link to="/elections" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour aux scrutins
      </Link>

      {/* En-tête du Scrutin Glassmorphism */}
      <div className="rounded-3xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{election.title}</h1>
          <Badge variant={election.status === 'open' ? 'success' : election.status === 'closed' ? 'warning' : 'neutral'}>
            {election.status === 'open' ? 'Scrutin ouvert' : election.status === 'closed' ? 'Scrutin clos' : election.status}
          </Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          {election.description ?? 'Aucune description fournie.'}
        </p>

        <div className="flex items-center gap-3 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-500/10 px-4 py-3 rounded-2xl border border-brand-500/20 backdrop-blur-md w-full sm:w-fit">
          <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <span>Garantie d'anonymat absolu : votre identité est complètement dissociée de votre suffrage.</span>
        </div>
      </div>

      {/* Message de confirmation de vote */}
      {hasVoted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 backdrop-blur-xl rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-300 text-base">Votre suffrage a été enregistré dans l'urne cryptographique.</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Merci pour votre participation citoyenne au sein de l'institution.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Titre section candidats & Résultats */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Candidatures validées ({candidates.length})
        </h2>
        <button onClick={() => navigate(`/elections/${election.id}/results`)} className="btn-secondary text-sm flex items-center gap-2 rounded-xl px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800">
          <BarChart3 className="h-4 w-4 text-brand-600" /> {election.status === 'open' ? 'Suivre les résultats en direct' : 'Consulter les résultats officiels'}
        </button>
      </div>

      {!isOpen && !hasVoted && (
        <Card className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Lock className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span>Ce scrutin est actuellement <strong>{election.status}</strong>. Les votes ne sont pas ouverts.</span>
          </div>
        </Card>
      )}

      {/* Grille des candidats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {candidates.map((c, i) => {
          const isSelected = selectedCandidate?.id === c.id;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                interactive={isOpen && !hasVoted}
                onClick={() => isOpen && !hasVoted && setSelectedCandidate(c)}
                className={`h-full relative transition-all rounded-3xl p-6 backdrop-blur-xl border ${
                  isSelected 
                    ? 'border-2 border-brand-600 bg-brand-500/5 dark:bg-brand-950/20 ring-4 ring-brand-500/10' 
                    : 'border-white/40 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 text-xl font-extrabold text-brand-700 dark:text-brand-300 border border-brand-500/30">
                    {c.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">{c.display_name}</h3>
                      {isSelected && <Badge variant="brand">Sélectionné</Badge>}
                    </div>

                    {c.program_url && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgramCandidate(c);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                        >
                          <FileText className="h-4 w-4" /> Consulter le programme & profession de foi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Action de confirmation */}
      {isOpen && !hasVoted && selectedCandidate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex justify-center">
          <button 
            onClick={() => setShowConfirm(true)} 
            className="btn-primary text-base px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-brand-600/30 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold transition-all"
          >
            <Vote className="h-5 w-5" /> Confirmer mon vote pour {selectedCandidate.display_name}
          </button>
        </motion.div>
      )}

      {/* Modal de Confirmation */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirmation définitive du vote">
        <div className="space-y-6">
          <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 p-5 border border-amber-500/30 backdrop-blur-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              Vous êtes sur le point de valider votre vote pour <strong>{selectedCandidate?.display_name}</strong>. 
              Conformément aux règles de sécurité, <strong>cette action est irréversible</strong> et votre choix sera anonymisé de manière définitive.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800">Annuler</button>
            <button onClick={handleVote} className="btn-primary flex-1 py-3 rounded-xl bg-brand-600 text-white font-bold" disabled={casting}>
              {casting ? 'Chiffrement en cours...' : 'Voter définitivement'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Programme Candidat */}
      <Modal open={!!programCandidate} onClose={() => setProgramCandidate(null)} title={`Programme — ${programCandidate?.display_name}`}>
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Consultez le document officiel et la profession de foi déposés par le candidat auprès de l'administration.
          </p>
          {programCandidate?.program_url && (
            <a
              href={programCandidate.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <ExternalLink className="h-4 w-4" /> Ouvrir le document officiel
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}