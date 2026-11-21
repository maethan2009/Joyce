import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  CreditCard,
  Inbox,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Users,
  Vote,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { eventsService, notificationsService } from '@/services';
import type { AppNotification, CampusEvent } from '@/types';
import { canAccessAcademicHub, canAccessStudentCard } from '@/types';
import { PageMeta } from '@/components/PageMeta';

export function DashboardView() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent'>('all');

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const userId = user?.id;

  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [notifList, eventList] = await Promise.all([
          userId ? notificationsService.listMine(userId) : Promise.resolve([]),
          eventsService.listEvents().catch(() => [] as CampusEvent[]),
        ]);
        if (!active) return;
        setNotifications(notifList);
        setEvents(eventList);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboardData();
    return () => {
      active = false;
    };
  }, [userId]);

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'Membre';
  const role = profile?.role;

  const getWeekDays = (monday: Date) => {
    const days = [];
    const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const iso = date.toISOString().split('T')[0];
      days.push({
        fullDate: date,
        label: dayNames[i],
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
        isoString: iso,
        hasEvents: events.some((ev) => ev.date === iso),
      });
    }
    return days;
  };

  const currentDays = getWeekDays(currentWeekStart);
  const selectedIso = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter((ev) => ev.date === selectedIso);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'À l’instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} h`;
    return `Il y a ${Math.floor(diffInHours / 24)} j`;
  };

  const handleMarkRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const filteredNotifications =
    activeTab === 'urgent' ? notifications.filter((n) => n.type === 'urgent') : notifications;

  const pillarCards = [
    {
      pillar: 'Pilier 1 · Académique & Campus',
      title: canAccessAcademicHub(role) ? 'Espace Académique' : 'Événements Campus',
      description: canAccessAcademicHub(role)
        ? 'Modules, relevés LMD, devoirs et documents.'
        : 'Conférences, forums et vie étudiante.',
      icon: BookOpen,
      path: canAccessAcademicHub(role) ? '/hub' : '/events',
    },
    ...(canAccessStudentCard(role)
      ? [
          {
            pillar: 'Pilier 1 · Identité',
            title: 'Carte Étudiante QR',
            description: 'Badge numérique certifié avec code dynamique.',
            icon: CreditCard,
            path: '/student-card',
          },
        ]
      : []),
    {
      pillar: 'Pilier 2 · Orientation & Avenir',
      title: 'Écoles, Bourses & Métiers',
      description: 'Comparez les filières, bourses et fiches métiers A–Z.',
      icon: Compass,
      path: '/orientation',
    },
    {
      pillar: 'Pilier 3 · EduAmis & Messagerie',
      title: 'EduAmis & Discussions',
      description: 'Publications campus, SkillLink et messagerie directe.',
      icon: MessageSquare,
      path: '/eduamis',
    },
    ...(role === 'pro_recruiter' || role === 'school_admin' || role === 'super_admin'
      ? [
          {
            pillar: 'Pilier 4 · Pro & Gouvernance',
            title:
              role === 'super_admin'
                ? 'Super Administration'
                : role === 'school_admin'
                  ? 'Gestion Établissement'
                  : 'Portail Pro',
            description: 'Validation, talents, cours certifiants et registre.',
            icon: Briefcase,
            path: role === 'super_admin' ? '/admin' : role === 'school_admin' ? '/school' : '/pro',
          },
        ]
      : [
          {
            pillar: 'Pilier 3 · Entraide',
            title: 'SkillLink & Talents',
            description: 'Offres de tutorat et collaboration entre pairs.',
            icon: Users,
            path: '/skilllink',
          },
        ]),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto antialiased">
      <PageMeta title="Tableau de bord" description="Vue unifiée des 4 piliers EduCampus." />

      {/* En-tête Noir & Bordeaux */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="inline-block rounded border border-brand-700 bg-brand-950 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand-300">
              {profile?.school?.name || profile?.company_name || 'Espace Centralisé EduCampus'}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Bonjour, {firstName}
            </h1>
            <p className="text-zinc-300 text-sm max-w-2xl">
              Accédez aux 4 piliers EduCampus, consultez le calendrier officiel des événements et suivez vos notifications en direct.
            </p>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 shrink-0 self-start lg:self-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Statut du dossier</p>
              <p className="text-sm font-semibold text-white">
                {profile?.account_status === 'pending'
                  ? 'En attente de validation'
                  : profile?.matricule
                    ? `Vérifié · ${profile.matricule}`
                    : 'Session active'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Les 4 Piliers en accès direct */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
              Accès aux 4 Piliers EduCampus
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Navigation directe vers vos espaces autorisés
            </p>
          </div>
          {canAccessAcademicHub(role) && (
            <button
              type="button"
              onClick={() => navigate('/elections')}
              className="btn-secondary text-xs"
            >
              <Vote className="h-3.5 w-3.5" />
              <span>Scrutins Campus</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillarCards.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="group text-left p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-600 dark:hover:border-brand-500 transition-colors flex flex-col justify-between gap-5 shadow-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {item.pillar}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Agenda réel + Flux Notifications Supabase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendrier synchronisé avec table events */}
        <section className="lg:col-span-7 xl:col-span-8 card-base p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                  Agenda Campus
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Événements publiés sur votre établissement
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 self-start sm:self-auto">
              {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shrink-0"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-6 gap-2 w-full">
              {currentDays.map((day) => {
                const isSelected = selectedDate.toDateString() === day.fullDate.toDateString();
                return (
                  <button
                    key={day.isoString}
                    type="button"
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`p-2.5 rounded-xl text-center transition-colors flex flex-col items-center justify-center relative border ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider">{day.label}</span>
                    <span className="text-base font-bold tabular-nums mt-0.5">{day.dayNumber}</span>
                    {(day.isToday || day.hasEvents) && !isSelected && (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shrink-0"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {dayEvents.length === 0 ? (
            <div className="min-h-[180px] rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Aucun événement le{' '}
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Les événements campus enregistrés dans la base apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => navigate('/events')}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-600 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                      {ev.category}
                    </p>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{ev.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {[ev.time, ev.location].filter(Boolean).join(' · ') || 'Campus'}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications réelles */}
        <section className="lg:col-span-5 xl:col-span-4 card-base p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                    Notifications
                  </h2>
                  <p className="text-[11px] text-zinc-500">Alertes et annonces</p>
                </div>
              </div>

              <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('urgent')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'urgent'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Urgentes
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="text-xs">Chargement…</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Inbox className="w-8 h-8 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Aucune notification pour le moment
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Les annonces officielles liées à votre compte apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => void handleMarkRead(act.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                      act.is_read
                        ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-75'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-brand-200 dark:border-brand-900'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {act.category}
                        </span>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatTimeAgo(act.created_at)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-white mt-1 truncate">
                        {act.title}
                      </h4>
                      {act.description && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/events')}
            className="btn-secondary w-full justify-center"
          >
            <span>Voir le calendrier campus</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  );
}