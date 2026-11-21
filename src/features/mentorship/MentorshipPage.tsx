import { useCallback, useEffect, useState } from 'react';
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

  const reload = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMatches(await mentorshipService.listMatches(user.id));
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
      addToast('success', 'Préférences enregistrées.');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la sauvegarde.');
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
      addToast('success', 'Suggestions générées.');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors du matching.');
    } finally {
      setBusy(false);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await mentorshipService.updateMatchStatus(id, status);
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la mise à jour.');
    }
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'mx-auto max-w-4xl px-4 py-8'}`}>
      {!embedded && (
        <PageMeta
          title="Mentorat & Parrainage"
          description="Matching mentor / mentoré selon filière et centres d’intérêt."
        />
      )}
      {!embedded && (
        <header className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pilier 1 · Vie de Campus
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
            Mentorat &amp; Parrainage
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Module d’entraide inter-promotions activé par votre établissement.
          </p>
        </header>
      )}

      <section className="card-base p-5 space-y-3">
        <h2 className="font-semibold text-sm text-zinc-950 dark:text-white">Vos centres d’intérêt académiques</h2>
        <input
          className="input-base"
          placeholder="ex. réseaux, architecture logicielle, cybersécurité, design"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => void savePrefs()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer &amp; devenir mentor disponible
          </button>
          <button type="button" className="btn-primary" onClick={() => void generate()} disabled={busy}>
            Générer des suggestions
          </button>
        </div>
      </section>

      {loading ? (
        <div className="py-12 flex justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="Aucun binôme pour l’instant"
          description="Enregistrez vos centres d’intérêt puis générez des suggestions de mentorat."
          icon={Users}
        />
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id} className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-950 dark:text-white">
                  {m.mentor?.full_name || 'Mentor'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  Compatibilité {(m.match_score * 100).toFixed(0)}% · Statut : {m.status}
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
