import { useEffect, useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { messagingService } from '@/services';
import { createFormGuard } from '@/lib/antispam';
import type { Conversation, DirectMessage } from '@/types';

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const list = await messagingService.listConversations(user.id);
        setConversations(list);
        if (list[0] && !activeId) setActiveId(list[0].id);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!activeId) return;
    let unsub = () => {};
    (async () => {
      try {
        const msgs = await messagingService.listMessages(activeId);
        setMessages(msgs);
        unsub = messagingService.subscribe(activeId, (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
      } catch {
        setMessages([]);
      }
    })();
    return () => unsub();
  }, [activeId]);

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
      addToast('error', ex instanceof Error ? ex.message : 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <PageMeta title="Messagerie" description="Échanges directs entre étudiants, écoles et professionnels." />
      <header>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">Messagerie</h1>
        <p className="text-sm text-slate-500 mt-1">Contactez talents et professionnels en toute sécurité.</p>
      </header>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-12">Chargement…</p>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Démarrez un échange depuis SkillLink Pro ou le profil d’un talent."
          icon={MessageSquare}
        />
      ) : (
        <div className="grid md:grid-cols-[240px_1fr] gap-4 min-h-[420px]">
          <aside className="card-base p-2 space-y-1 overflow-y-auto max-h-[60vh]">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${
                  activeId === c.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c.subject || 'Conversation'}
              </button>
            ))}
          </aside>

          <section className="card-base flex flex-col min-h-[420px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun message pour l’instant.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.sender_id === user?.id
                        ? 'ml-auto bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.body}
                    <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} className="border-t border-slate-100 dark:border-slate-800 p-3 flex gap-2">
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
    </div>
  );
}
