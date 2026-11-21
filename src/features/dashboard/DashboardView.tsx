import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  BookOpen, 
  Vote, 
  UserCheck, 
  Clock, 
  Sparkles,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Bell,
  Inbox,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  title: string;
  category: string;
  created_at: string;
  type: 'urgent' | 'info' | 'system';
  description?: string;
}

export function DashboardView() {
  const navigate = useNavigate();
  const [userProfile] = useState({ firstName: 'Fanon', role: 'Étudiant' });

  // État des notifications et activités (initialisé vide)
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent'>('all');

  // Gestion du calendrier de la semaine
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Récupération des vraies notifications depuis Supabase sans aucun mockdata
  useEffect(() => {
    async function fetchActivities() {
      setLoadingActivities(true);
      try {
        if (!supabase) {
          setLoadingActivities(false);
          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data) {
          setActivities(data);
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.error('Erreur chargement activités:', err);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    }

    fetchActivities();
  }, []);

  // Générateur de jours de la semaine (LUN-SAM)
  const getWeekDays = (monday: Date) => {
    const days = [];
    const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        fullDate: date,
        label: dayNames[i],
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
        isoString: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const currentDays = getWeekDays(currentWeekStart);

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
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  const filteredActivities = activeTab === 'urgent' 
    ? activities.filter(a => a.type === 'urgent')
    : activities;

  // Configuration des 5 cartes d'Accès Rapides
  const quickActions = [
    {
      title: 'Carte Étudiant',
      subtitle: 'Accès & Matricule',
      description: 'QR Code sécurisé & vérification NFC',
      icon: CreditCard,
      badge: 'Active',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      gradient: 'from-blue-600 to-indigo-600',
      path: '/student-card',
    },
    {
      title: 'Academic Hub',
      subtitle: 'Cours & Synthèses',
      description: 'Documents certifiés & relevés',
      icon: BookOpen,
      badge: 'Support',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      gradient: 'from-emerald-600 to-teal-600',
      path: '/hub',
    },
    {
      title: 'Élections BDE',
      subtitle: 'E-Voting Chiffré',
      description: 'Participez aux décisions du campus',
      icon: Vote,
      badge: 'Live',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      gradient: 'from-purple-600 to-pink-600',
      path: '/elections',
    },
    {
      title: 'SkillLink',
      subtitle: 'Réseau de Talents',
      description: 'Échangez vos compétences entre pairs',
      icon: Sparkles,
      badge: 'Nouveau',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      gradient: 'from-amber-500 to-orange-600',
      path: '/skilllink',
    },
    {
      title: 'Mentorship',
      subtitle: 'Accompagnement',
      description: 'Trouvez un mentor ou aidez un cadet',
      icon: UserCheck,
      badge: 'Ouvert',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      gradient: 'from-rose-500 to-red-600',
      path: '/mentorship',
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto antialiased">
      
      {/* 1. Header / Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800/80 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-slate-200 text-xs font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Campus Digital Sync</span>
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="text-slate-300 font-mono">v2.4.0</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display">
              Bienvenue sur EduCampus, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-300">{userProfile.firstName}</span> 👋
            </h1>
            
            <p className="text-slate-300/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              Consultez vos flux d'informations en direct, gérez votre agenda de la semaine et accédez aux services académiques centralisés.
            </p>
          </div>

          {/* Widget Statut Système */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shrink-0 self-start lg:self-auto shadow-inner">
            <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs text-slate-400 font-mono font-medium uppercase tracking-wider">État Réseau</p>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">Services Connectés • 24ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Section Accès Rapides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Accès Rapides</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Vos modules d'interaction et de gestion quotidienne</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <div 
                key={idx}
                onClick={() => navigate(action.path)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {action.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {action.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="group-hover:underline">Accéder</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Layout Principal (Agenda + Flux d'Actualités Réel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Agenda Interactif */}
        <div className="lg:col-span-7 xl:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Planning Hebdomadaire</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Emploi du temps synchronisé avec l'administration</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Navigation Hebdo */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={handlePrevWeek}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-6 gap-2 w-full">
                {currentDays.map((day, idx) => {
                  const isSelected = selectedDate.toDateString() === day.fullDate.toDateString();
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day.fullDate)}
                      className={`p-3 rounded-2xl text-center transition-all duration-200 flex flex-col items-center justify-center relative ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 z-10' 
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/50'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-extrabold tracking-wider">{day.label}</span>
                      <span className="text-base font-bold mt-0.5">{day.dayNumber}</span>
                      {day.isToday && !isSelected && (
                        <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextWeek}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                title="Semaine suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* État vide cours */}
            <div className="min-h-[220px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center p-6 text-center">
              <div className="max-w-sm">
                <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3 opacity-60" />
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                  Aucune séance le {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Les cours et examens ajoutés par le secrétariat académique apparaîtront instantanément ici.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feed de Notifications / Flash Info Pro Clean */}
        <div className="lg:col-span-5 xl:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Flux d'Informations</h3>
                  <p className="text-[11px] text-slate-400">Annonces & Notifications</p>
                </div>
              </div>
              
              {/* Filtre Onglets */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'all' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setActiveTab('urgent')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'urgent' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Urgentes
                </button>
              </div>
            </div>

            {/* Chargement & État vide pur sans mockdata */}
            {loadingActivities ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Synchronisation du flux...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                <Inbox className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-700 mb-1" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Aucune annonce pour le moment</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                  Les messages officiels de l'administration et des délégués s'afficheront en direct ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredActivities.map((act) => (
                  <div 
                    key={act.id} 
                    className="group p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3.5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      act.type === 'urgent' 
                        ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20' 
                        : act.type === 'system'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {act.type === 'urgent' ? <Vote className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {act.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">{formatTimeAgo(act.created_at)}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {act.title}
                      </h4>

                      {act.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-700/50">
            <span>Voir toutes les notifications</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}