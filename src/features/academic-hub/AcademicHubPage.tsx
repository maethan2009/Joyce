import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckSquare,
  Download,
  FolderDown,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { academicService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import type {
  AcademicAssignment,
  AcademicGrade,
  AcademicModule,
  AcademicResource,
  Certification,
  ProfessionalCourse,
} from '@/types';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';

type HubTab = 'overview' | 'courses' | 'assignments' | 'resources' | 'grades' | 'formations';

export function AcademicHubPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [modules, setModules] = useState<AcademicModule[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [assignments, setAssignments] = useState<AcademicAssignment[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [proCourses, setProCourses] = useState<ProfessionalCourse[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const userId = user?.id;

  useEffect(() => {
    let active = true;
    async function loadAcademicData() {
      setLoading(true);
      try {
        const [mods, grds, assigns, resList, courses, certs] = await Promise.all([
          academicService.listModules().catch(() => [] as AcademicModule[]),
          userId ? academicService.listGrades(userId).catch(() => [] as AcademicGrade[]) : Promise.resolve([]),
          academicService.listAssignments().catch(() => [] as AcademicAssignment[]),
          academicService.listResources().catch(() => [] as AcademicResource[]),
          academicService.listCourses().catch(() => [] as ProfessionalCourse[]),
          userId ? academicService.listCertifications(userId).catch(() => [] as Certification[]) : Promise.resolve([]),
        ]);
        if (!active) return;
        setModules(mods);
        setGrades(grds);
        setAssignments(assigns);
        setResources(resList);
        setProCourses(courses);
        setCertifications(certs);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAcademicData();
    return () => {
      active = false;
    };
  }, [userId]);

  const metrics = useMemo(() => {
    const totalCredits = modules.reduce((sum, m) => sum + Number(m.ects || 0), 0);
    const earnedCredits = grades.reduce((sum, g) => sum + Number(g.ects_earned || 0), 0);
    const scored = grades.filter((g) => g.grade !== null);
    const averageOn20 =
      scored.length > 0
        ? (scored.reduce((sum, g) => sum + Number(g.grade || 0), 0) / scored.length).toFixed(2)
        : '—';
    const gpa =
      scored.length > 0
        ? (
            scored.reduce((sum, g) => {
              const pct = (Number(g.grade || 0) / 20) * 100;
              if (pct >= 80) return sum + 4;
              if (pct >= 70) return sum + 3;
              if (pct >= 60) return sum + 2;
              if (pct >= 50) return sum + 1;
              return sum;
            }, 0) / scored.length
          ).toFixed(2)
        : '—';
    return { totalCredits, earnedCredits, averageOn20, gpa };
  }, [modules, grades]);

  const q = searchQuery.trim().toLowerCase();
  const filteredModules = useMemo(
    () =>
      modules.filter(
        (m) =>
          !q ||
          m.title.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          (m.filiere ?? '').toLowerCase().includes(q),
      ),
    [modules, q],
  );
  const filteredAssignments = useMemo(
    () =>
      assignments.filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q),
      ),
    [assignments, q],
  );
  const filteredResources = useMemo(
    () =>
      resources.filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.matiere.toLowerCase().includes(q) ||
          r.filiere.toLowerCase().includes(q),
      ),
    [resources, q],
  );

  const handleDownloadResource = async (res: AcademicResource) => {
    try {
      const url = await academicService.getSignedUrl(res.storage_path);
      await academicService.incrementDownload(res.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.title;
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Téléchargement indisponible.');
    }
  };

  const handleRequestCertification = async (course: ProfessionalCourse) => {
    if (!user) return;
    try {
      const cert = await academicService.requestCertification({
        student_id: user.id,
        course_id: course.id,
        title: course.title,
        skills: course.skills ?? [],
      });
      setCertifications((prev) => [cert, ...prev]);
      addToast('success', 'Demande de certification envoyée au formateur.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Demande impossible.');
    }
  };

  const tabs: { id: HubTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: BookOpen },
    { id: 'courses', label: 'Modules', icon: GraduationCap },
    { id: 'assignments', label: 'Devoirs & TP', icon: CheckSquare },
    { id: 'resources', label: 'Bibliothèque', icon: FolderDown },
    { id: 'grades', label: 'Relevé & GPA', icon: BarChart3 },
    { id: 'formations', label: 'Formations Pro', icon: Award },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 antialiased">
      <PageMeta title="Espace Académique" description="Modules, devoirs, notes, ressources et formations EduCampus." />

      {/* En-tête */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block rounded border border-brand-700 bg-brand-950 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand-300">
              Pilier 1 · Espace Académique
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Espace Académique & Ressources
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Données synchronisées depuis votre établissement : unités d’enseignement, devoirs, relevés et supports de cours.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 tabular-nums">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Moyenne</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-white">
                {metrics.averageOn20}
                <span className="text-xs text-zinc-500">/20</span>
              </p>
            </div>
            <div className="text-center border-x border-zinc-800 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GPA</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-brand-400">
                {metrics.gpa}
                <span className="text-xs text-zinc-500">/4.0</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ECTS</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-white">
                {metrics.earnedCredits}
                <span className="text-xs text-zinc-500">/{metrics.totalCredits}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets & Recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un module, devoir, support…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Chargement des données académiques…</span>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-4">
                <h2 className="font-display text-base font-bold">Modules de l’établissement</h2>
                {filteredModules.length === 0 ? (
                  <EmptyState
                    title="Aucun module académique publié"
                    description="Votre établissement n’a pas encore publié d’unités d’enseignement dans Supabase."
                    icon={GraduationCap}
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredModules.map((mod) => (
                      <div key={mod.id} className="card-base p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                            {mod.code}
                          </span>
                          <span className="font-mono text-xs text-zinc-500 tabular-nums">
                            {mod.ects} ECTS
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-zinc-950 dark:text-white">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {[mod.filiere, mod.niveau, mod.semester].filter(Boolean).join(' · ') || 'Programme officiel'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="font-display text-base font-bold">Échéances & Devoirs</h2>
                {filteredAssignments.length === 0 ? (
                  <EmptyState
                    title="Aucun devoir en attente"
                    description="Les travaux pratiques et évaluations assignés s’afficheront ici."
                    icon={CheckSquare}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredAssignments.map((a) => (
                      <div key={a.id} className="card-base p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold uppercase text-brand-600">{a.assignment_type}</span>
                          {a.due_at && (
                            <span className="font-mono text-zinc-500">
                              {new Date(a.due_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{a.title}</h3>
                        {a.description && <p className="text-xs text-zinc-500">{a.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {filteredModules.length === 0 ? (
                <EmptyState
                  title="Aucun module disponible"
                  description="Les modules de cours enregistrés par votre établissement apparaîtront ici."
                  icon={GraduationCap}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModules.map((mod) => (
                    <div key={mod.id} className="card-base p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-brand-600">{mod.code}</span>
                        <span className="font-mono text-xs text-zinc-500 tabular-nums">{mod.ects} ECTS</span>
                      </div>
                      <h3 className="font-display text-base font-bold">{mod.title}</h3>
                      <p className="text-xs text-zinc-500">
                        {[mod.filiere, mod.niveau, mod.semester, mod.academic_year].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {filteredAssignments.length === 0 ? (
                <EmptyState
                  title="Aucun devoir ou TP"
                  description="Aucun travail pratique ou examen programmé dans la base."
                  icon={CheckSquare}
                />
              ) : (
                <div className="space-y-3">
                  {filteredAssignments.map((a) => (
                    <div key={a.id} className="card-base p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                          {a.assignment_type}
                        </span>
                        <h3 className="font-display text-base font-bold mt-0.5">{a.title}</h3>
                        {a.description && <p className="text-xs text-zinc-500 mt-1">{a.description}</p>}
                      </div>
                      <div className="text-xs font-mono text-zinc-500 shrink-0">
                        {a.due_at ? `Échéance : ${new Date(a.due_at).toLocaleDateString('fr-FR')}` : 'Date à confirmer'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {filteredResources.length === 0 ? (
                <EmptyState
                  title="Bibliothèque vide"
                  description="Aucun support de cours ou annale disponible pour le moment."
                  icon={FolderDown}
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredResources.map((res) => (
                    <div key={res.id} className="card-base p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[11px] font-bold uppercase text-brand-600">
                          {res.matiere} · {res.resource_type}
                        </span>
                        <h3 className="text-sm font-bold truncate">{res.title}</h3>
                        <p className="text-xs text-zinc-500">
                          {res.filiere} · {res.niveau} · {res.download_count} téléchargements
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDownloadResource(res)}
                        className="btn-secondary p-2.5 shrink-0"
                        aria-label={`Télécharger ${res.title}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'grades' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {grades.length === 0 ? (
                <EmptyState
                  title="Aucune note enregistrée"
                  description="Vos notes publiées par l’administration apparaîtront dans ce tableau."
                  icon={BarChart3}
                />
              ) : (
                <div className="card-base overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase font-mono">
                        <tr>
                          <th className="p-4">Code</th>
                          <th className="p-4">Module</th>
                          <th className="p-4">Note (/20)</th>
                          <th className="p-4">ECTS validés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {grades.map((g) => (
                          <tr key={g.id}>
                            <td className="p-4 font-mono font-bold text-brand-600">
                              {g.module?.code || '—'}
                            </td>
                            <td className="p-4 font-semibold">{g.module?.title || 'Module'}</td>
                            <td className="p-4 font-mono font-bold">
                              {g.grade !== null ? `${Number(g.grade).toFixed(2)} / 20` : 'En attente'}
                            </td>
                            <td className="p-4 font-mono">{g.ects_earned}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'formations' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <section className="space-y-4">
                <h2 className="font-display text-base font-bold">Formations publiées par des partenaires Pro</h2>
                {proCourses.length === 0 ? (
                  <EmptyState
                    title="Aucune formation publiée"
                    description="Les partenaires professionnels publieront ici des formations certifiantes."
                    icon={Award}
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {proCourses.map((course) => (
                      <div key={course.id} className="card-base p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-display text-base font-bold">{course.title}</h3>
                          <p className="text-xs text-zinc-500">
                            Par {course.author?.company_name || course.author?.full_name || 'Partenaire Pro'}
                          </p>
                          {course.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{course.description}</p>
                          )}
                          {course.skills?.length > 0 && (
                            <p className="text-[11px] font-semibold text-brand-600">
                              {course.skills.join(' · ')}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRequestCertification(course)}
                          className="btn-secondary w-full"
                        >
                          Demander la certification
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="font-display text-base font-bold">Mes certifications</h2>
                {certifications.length === 0 ? (
                  <EmptyState
                    title="Aucune certification"
                    description="Vos demandes et certifications validées apparaîtront ici."
                    icon={ShieldCheck}
                  />
                ) : (
                  <div className="space-y-2">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="card-base p-4 flex items-center justify-between gap-4 text-sm">
                        <div>
                          <p className="font-bold">{cert.title}</p>
                          {cert.skills?.length > 0 && (
                            <p className="text-xs text-zinc-500">{cert.skills.join(' · ')}</p>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold uppercase text-brand-600">
                          {cert.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}