import { useEffect, useState } from 'react';
import { Users, Send, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { socialService } from '@/services';
import { createFormGuard, compressImageForUpload } from '@/lib/antispam';
import type { Profile, SocialPost } from '@/types';
import { supabase } from '@/lib/supabase';

export function EduAmisPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [body, setBody] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [guard] = useState(() => createFormGuard());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'feed' | 'network'>('feed');

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [feed, fol, fing] = await Promise.all([
        socialService.listFeed(),
        socialService.listFollowers(user.id),
        socialService.listFollowing(user.id),
      ]);
      setPosts(feed);
      setFollowers(fol);
      setFollowing(fing);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [user?.id]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const err = guard.validate(honeypot);
    if (err) {
      addToast('error', err);
      return;
    }
    if (body.trim().length < 2) {
      addToast('error', 'Écrivez un message un peu plus long.');
      return;
    }
    setSubmitting(true);
    try {
      await socialService.createPost(user.id, body.trim());
      setBody('');
      addToast('success', 'Publication envoyée');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Publication impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImage = async (file: File | null) => {
    if (!file || !user) return;
    try {
      const blob = await compressImageForUpload(file);
      const path = `${user.id}/${Date.now()}.webp`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/webp',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await socialService.createPost(user.id, body.trim() || 'Nouvelle image', data.publicUrl);
      setBody('');
      addToast('success', 'Image publiée');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Upload impossible');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <PageMeta title="EduAmis" description="Fil social EduAmis — publications, abonnés et abonnements." />

      <header>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">EduAmis</h1>
        <p className="text-sm text-slate-500 mt-1">Partagez vos réussites et suivez la communauté.</p>
      </header>

      <div className="flex gap-2">
        <button type="button" className={tab === 'feed' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('feed')}>
          Fil
        </button>
        <button type="button" className={tab === 'network' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('network')}>
          Réseau
        </button>
      </div>

      {tab === 'feed' && (
        <>
          <form onSubmit={handlePublish} className="card-base p-4 space-y-3">
            <label className="sr-only" htmlFor="eduamis-body">
              Nouvelle publication
            </label>
            <textarea
              id="eduamis-body"
              className="input-base min-h-[88px] resize-y"
              placeholder="Partagez une réussite, une certification, une info campus…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              required
            />
            {/* Honeypot */}
            <input
              type="text"
              name={guard.honeypotName}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="btn-ghost cursor-pointer text-xs">
                Image (WebP compressée)
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publier
              </button>
            </div>
          </form>

          {loading ? (
            <p className="text-center text-sm text-slate-400 py-10">Chargement…</p>
          ) : posts.length === 0 ? (
            <EmptyState
              title="Aucune publication"
              description="Soyez le premier à partager une actualité sur EduAmis."
              icon={Users}
            />
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="card-base p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                      {(p.author?.full_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {p.author?.full_name || 'Membre'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{p.body}</p>
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt="Illustration de la publication"
                      className="mt-3 rounded-xl max-h-72 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'network' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="card-base p-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Abonnés ({followers.length})
            </h2>
            {followers.length === 0 ? (
              <p className="text-xs text-slate-500">Pas encore d’abonnés.</p>
            ) : (
              <ul className="space-y-2">
                {followers.map((f) => (
                  <li key={f.id} className="text-sm text-slate-700 dark:text-slate-300">
                    {f.full_name}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card-base p-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Abonnements ({following.length})
            </h2>
            {following.length === 0 ? (
              <p className="text-xs text-slate-500">Vous ne suivez personne pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {following.map((f) => (
                  <li key={f.id} className="text-sm text-slate-700 dark:text-slate-300">
                    {f.full_name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
