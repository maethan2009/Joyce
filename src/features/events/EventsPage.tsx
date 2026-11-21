import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  Vote,
  Users,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { eventsService, mentorshipService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { canAccessStudentCard, isVerifiedStudent } from '@/types';
import type { CampusEvent } from '@/types';
import { ElectionListPage } from '@/features/elections/ElectionListPage';
import { MentorshipPage } from '@/features/mentorship/MentorshipPage';

type EventsTab = 'calendrier' | 'elections' | 'mentorat';

export function EventsPage() {
  const profile = useAppStore((s) => s.profile);
  const [tab, setTab] = useState<EventsTab>('calendrier');
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('TOUS');
  const [electionsEnabled, setElectionsEnabled] = useState(false);
  const [mentorshipEnabled, setMentorshipEnabled] = useState(false);
  const [selected, setSelected] = useState<CampusEvent | null>(null);

  const verified = isVerifiedStudent(profile?.role) || profile?.role === 'super_admin' || profile?.role === 'school_admin';

  useEffect(() => {
    (async () => {
      try {
        const [ev, el, me] = await Promise.all([
          eventsService.listEvents(),
          mentorshipService.isElectionsEnabled(),
          mentorshipService.isMentorshipEnabled(),
        ]);
        setEvents(ev);
        setElectionsEnabled(el || profile?.role === 'super_admin' || profile?.role === 'school_admin');
        setMentorshipEnabled(me || profile?.role === 'super_admin' || profile?.role === 'school_admin');
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.role]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const catOk = activeCategory === 'TOUS' || e.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const searchOk =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [events, activeCategory, searchQuery]);

  const tabs: { id: EventsTab; label: string; visible: boolean; icon: typeof CalendarIcon }[] = [
    { id: 'calendrier', label: 'Calendrier', visible: true, icon: CalendarIcon },
    { id: 'elections', label: 'Élections', visible: verified && electionsEnabled, icon: Vote },
    { id: 'mentorat', label: 'Mentorat & Parrainage', visible: verified && mentorshipEnabled, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageMeta
        title="Événements"
        description="Calendrier campus, élections et mentorat — selon les modules activés par votre école."
      />

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">Événements</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Un seul espace pour le calendrier, les élections et le mentorat (si activés par votre établissement).
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {tabs
          .filter((t) => t.visible)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'elections' && electionsEnabled && <ElectionListPage embedded />}
      {tab === 'mentorat' && mentorshipEnabled && <MentorshipPage embedded />}

      {tab === 'calendrier' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input-base pl-10"
                placeholder="Rechercher un événement…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['TOUS', 'ACADEMIQUE', 'CULTURE', 'PARRAINAGE', 'FERIE'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    activeCategory === c
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Aucun événement"
              description="Le calendrier est vide pour le moment. Les administrateurs scolaires pourront en publier."
              icon={CalendarIcon}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {filtered.map((evt) => (
                <li key={evt.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(evt)}
                    className="w-full text-left card-base overflow-hidden hover:shadow-card-hover transition"
                  >
                    {evt.image ? (
                      <img
                        src={evt.image}
                        alt={`Affiche — ${evt.title}`}
                        className="h-36 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center">
                        <CalendarIcon className="h-10 w-10 text-white/80" aria-hidden="true" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{evt.category}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{evt.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {evt.date}
                          {evt.time ? ` · ${evt.time}` : ''}
                        </span>
                        {evt.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!verified && canAccessStudentCard(profile?.role) === false && (
            <p className="text-xs text-slate-400 text-center">
              Les onglets Élections et Mentorat sont réservés aux comptes académiques vérifiés, lorsque l’école les active.{' '}
              <Link to="/enroll" className="text-brand-600 font-semibold">
                Vérifier mon matricule
              </Link>
            </p>
          )}
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="evt-title"
          >
            <h2 id="evt-title" className="font-display text-xl font-bold">
              {selected.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{selected.description || 'Pas de description.'}</p>
            {selected.program?.length > 0 && (
              <ul className="list-disc pl-4 text-sm text-slate-600 dark:text-slate-400">
                {selected.program.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <button type="button" className="btn-primary w-full" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
