import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send, Loader2, Plus } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { authService, messagingService } from '@/services';
import { createFormGuard } from '@/lib/antispam';
import type { Conversation, DirectMessage, Profile } from '@/types';

export function MessagingPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [guard] = useState(() => createFormGuard(1500));
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await messagingService.listConversations(user.id);
      setConversations(list);
      setActiveId((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      try {
        const msgs = await messagingService.listMessages(activeId);
        if (cancelled) return;
        setMessages(msgs);
        unsub = messagingService.subscribe(activeId, (msg) => {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        });
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, [activeId]);

  const openNewModal = async () => {
    setShowNewModal(true);
    try {
      const list = await authService.listApprovedProfiles();
      setMembers(list.filter((m) => m.id !== user?.id));
    } catch {
      setMembers([]);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      addToast('error', 'Sélectionnez un destinataire.');
      return;
    }
    setCreating(true);
    try {
      const id = await messagingService.startConversation(
        targetUserId,
        newSubject.trim() || 'Nouvelle discussion',
        newMessage.trim() || 'Bonjour !',
      );
      setShowNewModal(false);
      setTargetUserId('');
      setNewSubject('');
      setNewMessage('');
      await loadConversations();
      setActiveId(id);
      addToast('success', 'Conversation démarrée.');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Impossible de démarrer la discussion.');
    } finally {
      setCreating(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId) return;
    const err = guard.validate(honeypot);
    if (err) {
      addToast('error', err);
      return;
    }
    if (!body.trim()) return;
    setSending(true);
    try {
      const msg = await messagingService.sendMessage(activeId, user.id, body.trim());
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setBody('');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-5">
      <PageMeta title="Messagerie" description="Échanges directs entre étudiants, écoles et professionnels." />

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pilier 3 · EduAmis &amp; Messagerie
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
            Messagerie directe
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Contactez étudiants, mentors, écoles et recruteurs en temps réel.
          </p>
        </div>

        <button type="button" onClick={() => void openNewModal()} className="btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle discussion
        </button>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Démarrez un échange avec un membre approuvé, depuis SkillLink ou EduAmis."
          icon={MessageSquare}
        />
      ) : (
        <div className="grid md:grid-cols-[260px_1fr] gap-4 min-h-[440px]">
          <aside className="card-base p-2 space-y-1 overflow-y-auto max-h-[65vh]">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  activeId === c.id
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <p className="truncate">{c.subject || 'Conversation'}</p>
                <p
                  className={`text-[10px] mt-0.5 tabular-nums ${
                    activeId === c.id ? 'text-white/75' : 'text-zinc-400'
                  }`}
                >
                  {new Date(c.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </button>
            ))}
          </aside>

          <section className="card-base flex flex-col min-h-[440px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">Aucun message pour l’instant.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                      m.sender_id === user?.id
                        ? 'ml-auto bg-brand-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {m.body}
                    <p
                      className={`text-[10px] mt-1 tabular-nums ${
                        m.sender_id === user?.id ? 'text-white/70' : 'text-zinc-400'
                      }`}
                    >
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex gap-2">
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
              <input
                className="input-base flex-1"
                placeholder="Votre message…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={sending || !activeId}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      )}

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Démarrer une conversation">
        <form onSubmit={handleCreateConversation} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Destinataire *
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="input-base"
              required
            >
              <option value="">Choisir un membre approuvé…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Sujet</label>
            <input
              type="text"
              className="input-base"
              placeholder="ex. Collaboration projet, renseignement stage…"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Message</label>
            <textarea
              rows={3}
              className="input-base"
              placeholder="Votre premier message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Envoyer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
