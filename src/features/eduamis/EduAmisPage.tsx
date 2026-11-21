import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Send, Loader2, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { authService, messagingService, socialService } from '@/services';
import { createFormGuard, compressImageForUpload } from '@/lib/antispam';
import type { Profile, SocialPost } from '@/types';
import { supabase } from '@/lib/supabase';

export function EduAmisPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [directory, setDirectory] = useState<Profile[]>([]);
  const [body, setBody] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [guard] = useState(() => createFormGuard());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'feed' | 'network' | 'discover'>('feed');

  const reload = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [feed, fol, fing, members] = await Promise.all([
        socialService.listFeed(),
        socialService.listFollowers(user.id),
        socialService.listFollowing(user.id),
        authService.listApprovedProfiles(),
      ]);
      setPosts(feed);
      setFollowers(fol);
      setFollowing(fing);
      setDirectory(members.filter((m) => m.id !== user.id));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
      addToast('success', 'Publication envoyée.');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Publication impossible.');
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
      addToast('success', 'Image publiée.');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Upload impossible.');
    }
  };

  const handleToggleFollow = async (targetId: string) => {
    if (!user) return;
    try {
      const nowFollowing = await socialService.toggleFollow(user.id, targetId);
      addToast('info', nowFollowing ? 'Abonnement ajouté.' : 'Abonnement retiré.');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Action impossible.');
    }
  };

  const handleStartMessage = async (member: Profile) => {
    try {
      await messagingService.startConversation(
        member.id,
        `Discussion avec ${member.full_name}`,
        `Bonjour ${member.full_name}, ravi(e) de vous retrouver sur EduAmis.`,
      );
      navigate('/messaging');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Ouverture de conversation impossible.');
    }
  };

  const followingIds = new Set(following.map((f) => f.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <PageMeta title="EduAmis" description="Fil social EduAmis — publications, abonnés et échanges directs." />

      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Pilier 3 · EduAmis &amp; Messagerie
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
          EduAmis
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Partagez vos actualités académiques, suivez les membres et échangez en direct.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={tab === 'feed' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('feed')}
        >
          Fil d’actualité
        </button>
        <button
          type="button"
          className={tab === 'discover' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('discover')}
        >
          Découvrir ({directory.length})
        </button>
        <button
          type="button"
          className={tab === 'network' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('network')}
        >
          Mon réseau ({followers.length + following.length})
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
              placeholder="Partagez une réussite, une ressource, une actualité campus…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              required
            />
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
                Joindre une image (WebP)
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
            <div className="py-12 flex justify-center text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="Aucune publication"
              description="Soyez le premier à partager une actualité sur EduAmis."
              icon={Users}
            />
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="card-base p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                        {(p.author?.full_name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-950 dark:text-white">
                          {p.author?.full_name || 'Membre'}
                        </p>
                        <p className="text-[11px] text-zinc-500 tabular-nums">
                          {new Date(p.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {p.body}
                  </p>
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt="Illustration de la publication"
                      className="mt-3 rounded-lg max-h-72 w-full object-cover border border-zinc-200 dark:border-zinc-800"
                      loading="lazy"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'discover' && (
        loading ? (
          <div className="py-12 flex justify-center text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : directory.length === 0 ? (
          <EmptyState
            title="Aucun membre à afficher"
            description="Les comptes approuvés apparaîtront ici dès leur inscription."
            icon={Users}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {directory.map((member) => {
              const isFollowed = followingIds.has(member.id);
              return (
                <div key={member.id} className="card-base p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center text-sm font-bold">
                      {member.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">{member.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {member.filiere || member.headline || member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleFollow(member.id)}
                      className={isFollowed ? 'btn-secondary px-2.5 py-1.5 text-xs' : 'btn-primary px-2.5 py-1.5 text-xs'}
                    >
                      {isFollowed ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {isFollowed ? 'Suivi' : 'Suivre'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStartMessage(member)}
                      className="btn-ghost px-2 py-1.5"
                      title="Envoyer un message"
                      aria-label={`Contacter ${member.full_name}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'network' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="card-base p-5">
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white mb-3 tabular-nums">
              Abonnés ({followers.length})
            </h2>
            {followers.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun abonné pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {followers.map((f) => (
                  <li key={f.id} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>{f.full_name}</span>
                    <button
                      type="button"
                      onClick={() => void handleStartMessage(f)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Écrire
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card-base p-5">
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white mb-3 tabular-nums">
              Abonnements ({following.length})
            </h2>
            {following.length === 0 ? (
              <p className="text-xs text-zinc-500">Vous ne suivez personne pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {following.map((f) => (
                  <li key={f.id} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>{f.full_name}</span>
                    <button
                      type="button"
                      onClick={() => void handleToggleFollow(f.id)}
                      className="text-xs font-semibold text-zinc-500 hover:text-brand-600"
                    >
                      Ne plus suivre
                    </button>
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
