import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  Vote,
  Users,
  Loader2,
  X,
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

  const verified =
    isVerifiedStudent(profile?.role) ||
    profile?.role === 'super_admin' ||
    profile?.role === 'school_admin';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ev, el, me] = await Promise.all([
          eventsService.listEvents(),
          mentorshipService.isElectionsEnabled(),
          mentorshipService.isMentorshipEnabled(),
        ]);
        if (!active) return;
        setEvents(ev);
        setElectionsEnabled(el || profile?.role === 'super_admin' || profile?.role === 'school_admin');
        setMentorshipEnabled(me || profile?.role === 'super_admin' || profile?.role === 'school_admin');
      } catch {
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
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
        title="Événements & Vie de Campus"
        description="Calendrier campus, élections et mentorat — selon les modules activés par votre établissement."
      />

      <header className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Pilier 1 · Académique & Vie de Campus
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Événements &amp; Vie de Campus
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Calendrier officiel, scrutins institutionnels et parrainage selon les modules activés par votre école.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {tabs
          .filter((t) => t.visible)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                className="input-base pl-10"
                placeholder="Rechercher un événement, un lieu…"
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
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                    activeCategory === c
                      ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                      : 'bg-white dark:bg-[#111114] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Aucun événement programmé"
              description="Le calendrier est vide pour le moment. Les administrateurs scolaires peuvent publier des dates ici."
              icon={CalendarIcon}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {filtered.map((evt) => (
                <li key={evt.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(evt)}
                    className="w-full text-left card-base overflow-hidden hover:border-brand-600/60 transition-colors"
                  >
                    {evt.image ? (
                      <img
                        src={evt.image}
                        alt={`Affiche — ${evt.title}`}
                        className="h-36 w-full object-cover border-b border-zinc-200 dark:border-zinc-800"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-32 bg-zinc-950 dark:bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                            {evt.category}
                          </span>
                          <p className="font-mono text-sm font-semibold text-white mt-1 tabular-nums">{evt.date}</p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-zinc-600" aria-hidden="true" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        {evt.category}
                      </span>
                      <h3 className="font-display font-bold text-zinc-950 dark:text-white">{evt.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1 tabular-nums">
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
            <p className="text-xs text-zinc-500 text-center pt-2">
              Les onglets Élections et Mentorat sont réservés aux comptes académiques vérifiés, lorsque l’établissement les active.{' '}
              <Link to="/enroll" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                Vérifier mon matricule
              </Link>
            </p>
          )}
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-cabinet space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="evt-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {selected.category}
                </span>
                <h2 id="evt-title" className="font-display text-xl font-bold text-zinc-950 dark:text-white mt-0.5">
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {selected.description || 'Aucune description détaillée fournie.'}
            </p>
            {selected.program?.length > 0 && (
              <ul className="list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
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
