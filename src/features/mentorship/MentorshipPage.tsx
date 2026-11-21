import { useEffect, useState } from 'react';
import { Users, Loader2, Check, X } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { mentorshipService } from '@/services';
import type { MentorshipMatch } from '@/types';

export function MentorshipPage({ embedded = false }: { embedded?: boolean }) {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const addToast = useAppStore((s) => s.addToast);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const [matches, setMatches] = useState<MentorshipMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [interests, setInterests] = useState((profile?.interests || []).join(', '));

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setMatches(await mentorshipService.listMatches(user.id));
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [user?.id]);

  const savePrefs = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const list = interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await mentorshipService.setInterests(user.id, list);
      await mentorshipService.setMentorOptIn(user.id, true);
      await refreshProfile();
      addToast('success', 'Préférences enregistrées');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await mentorshipService.generateMatches(user.id);
      await reload();
      addToast('success', 'Suggestions générées');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await mentorshipService.updateMatchStatus(id, status);
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    }
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'mx-auto max-w-4xl px-4 py-8'}`}>
      {!embedded && (
        <PageMeta title="Mentorat & Parrainage" description="Matching mentor / mentoré selon filière et centres d’intérêt." />
      )}
      {!embedded && (
        <header>
          <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">Mentorat & Parrainage</h1>
          <p className="text-sm text-slate-500 mt-1">Module activé par votre établissement.</p>
        </header>
      )}

      <section className="card-base p-5 space-y-3">
        <h2 className="font-semibold text-sm">Vos centres d’intérêt</h2>
        <input
          className="input-base"
          placeholder="ex. réseaux, design, entrepreneuriat"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => void savePrefs()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer & devenir mentor disponible
          </button>
          <button type="button" className="btn-primary" onClick={() => void generate()} disabled={busy}>
            Générer des suggestions
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-8">Chargement…</p>
      ) : matches.length === 0 ? (
        <EmptyState
          title="Aucun match pour l’instant"
          description="Enregistrez vos intérêts puis générez des suggestions de mentorat."
          icon={Users}
        />
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id} className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {m.mentor?.full_name || 'Mentor'}
                </p>
                <p className="text-xs text-slate-500">
                  Score {(m.match_score * 100).toFixed(0)}% · {m.status}
                  {m.matched_on?.length ? ` · ${m.matched_on.join(', ')}` : ''}
                </p>
              </div>
              {m.status === 'proposed' && m.mentee_id === user?.id && (
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => void respond(m.id, 'accepted')}>
                    <Check className="h-4 w-4" /> Accepter
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => void respond(m.id, 'declined')}>
                    <X className="h-4 w-4" /> Refuser
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
