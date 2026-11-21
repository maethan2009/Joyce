import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Search,
  TrendingUp,
  Users,
  MessageSquare,
  FolderDown,
  BarChart3,
  CheckSquare,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  FileText,
  Award
} from 'lucide-react';
import { academicService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import type { Certification, ProfessionalCourse } from '@/types';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';

// --- TYPES DE DONNÉES ---
export interface Course {
  id: string;
  code: string;
  title: string;
  professor: string;
  credits: number;
  hours: number;
  progress: number;
  nextSession: string;
  room: string;
  semester: 'S1' | 'S2';
  isCertificationTrack?: boolean;
}

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  type: 'TP' | 'Projet' | 'CC' | 'Examen';
  grade?: number;
  maxGrade: number;
  submittedFileName?: string;
}

export interface Resource {
  id: string;
  title: string;
  courseCode: string;
  type: 'PDF' | 'ZIP' | 'LAB' | 'LINK';
  size: string;
  dateAdded: string;
}

export interface GradeRecord {
  courseId: string;
  ccGrade: number; // /20
  examGrade: number; // /20
}

export function AcademicHubPage() {
  // --- ÉTATS DYNAMIQUES (VIDES PAR DÉFAUT OU ALIMENTÉS PAR L'UTILISATEUR) ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeRecord>>({});

  // Navigation & Filtres
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'assignments' | 'resources' | 'grades' | 'formations'>('overview');
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>('S1');
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAppStore((s) => s.user);
  const [proCourses, setProCourses] = useState<ProfessionalCourse[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [c, certs] = await Promise.all([
          academicService.listCourses(),
          user ? academicService.listCertifications(user.id) : Promise.resolve([]),
        ]);
        setProCourses(c);
        setCertifications(certs);
      } catch {
        setProCourses([]);
        setCertifications([]);
      }
    })();
  }, [user?.id]);

  // Modales
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Formulaires - Nouveau Cours
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    professor: '',
    credits: 3,
    hours: 30,
    room: '',
    nextSession: '',
    semester: 'S1' as 'S1' | 'S2',
    isCertificationTrack: false
  });

  // Formulaires - Nouveau Devoir
  const [newAssignment, setNewAssignment] = useState({
    courseCode: '',
    title: '',
    dueDate: '',
    type: 'TP' as 'TP' | 'Projet' | 'CC' | 'Examen',
    maxGrade: 20
  });

  // Formulaires - Nouvelle Ressource
  const [newResource, setNewResource] = useState({
    title: '',
    courseCode: '',
    type: 'PDF' as 'PDF' | 'ZIP' | 'LAB' | 'LINK',
    size: '2.5 MB'
  });

  // --- CALCUL DU GPA ET MOYENNE (NORME INTERNATIONALE) ---
  const academicMetrics = useMemo(() => {
    const semCourses = courses.filter((c) => c.semester === selectedSemester);
    if (semCourses.length === 0) return { averageOn20: '0.00', gpaEquivalent: '0.00', totalCredits: 0 };

    let totalCredits = 0;
    let weightedScore20 = 0;
    let weightedGPAPoints = 0;

    semCourses.forEach((course) => {
      const record = grades[course.id] || { ccGrade: 0, examGrade: 0 };
      const finalScore20 = record.ccGrade * 0.4 + record.examGrade * 0.6;
      
      weightedScore20 += finalScore20 * course.credits;
      totalCredits += course.credits;

      const percentage = (finalScore20 / 20) * 100;
      let gpaPoint = 0.0;
      if (percentage >= 80) gpaPoint = 4.0;
      else if (percentage >= 70) gpaPoint = 3.0;
      else if (percentage >= 60) gpaPoint = 2.0;
      else if (percentage >= 50) gpaPoint = 1.0;
      else gpaPoint = 0.0;

      weightedGPAPoints += gpaPoint * course.credits;
    });

    const averageOn20 = totalCredits > 0 ? (weightedScore20 / totalCredits).toFixed(2) : '0.00';
    const gpaEquivalent = totalCredits > 0 ? (weightedGPAPoints / totalCredits).toFixed(2) : '0.00';

    return { averageOn20, gpaEquivalent, totalCredits };
  }, [courses, grades, selectedSemester]);

  // --- FILTRAGE DE RECHERCHE DYNAMIQUE ---
  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.professor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignments, searchQuery]);

  const filteredResources = useMemo(() => {
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title) return;

    const courseId = `course-${Date.now()}`;
    const createdCourse: Course = {
      ...newCourse,
      id: courseId,
      progress: 0
    };

    setCourses((prev) => [...prev, createdCourse]);
    setGrades((prev) => ({
      ...prev,
      [courseId]: { courseId, ccGrade: 0, examGrade: 0 }
    }));

    setNewCourse({
      code: '',
      title: '',
      professor: '',
      credits: 3,
      hours: 30,
      room: '',
      nextSession: '',
      semester: 'S1',
      isCertificationTrack: false
    });
    setShowAddCourseModal(false);
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.courseCode) return;

    const createdAssignment: Assignment = {
      ...newAssignment,
      id: `ass-${Date.now()}`,
      status: 'pending'
    };

    setAssignments((prev) => [...prev, createdAssignment]);
    setNewAssignment({ courseCode: '', title: '', dueDate: '', type: 'TP', maxGrade: 20 });
    setShowAddAssignmentModal(false);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.courseCode) return;

    const createdResource: Resource = {
      ...newResource,
      id: `res-${Date.now()}`,
      dateAdded: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };

    setResources((prev) => [...prev, createdResource]);
    setNewResource({ title: '', courseCode: '', type: 'PDF', size: '2.5 MB' });
    setShowAddResourceModal(false);
  };

  const handleUpdateGrade = (courseId: string, field: 'ccGrade' | 'examGrade', value: number) => {
    const sanitized = Math.min(20, Math.max(0, value || 0));
    setGrades((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: sanitized
      }
    }));
  };

  const handleConfirmSubmit = () => {
    if (!selectedAssignment || !selectedFile) return;

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === selectedAssignment.id
          ? { ...a, status: 'submitted', submittedFileName: selectedFile.name }
          : a
      )
    );

    setShowSubmitModal(false);
    setSelectedAssignment(null);
    setSelectedFile(null);
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setGrades((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 space-y-8 font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors">
      {/* ================= BANNIÈRE GLASSMORPHISME ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 lg:p-8 shadow-xl dark:shadow-2xl">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> High-Performance Academic Hub • {selectedSemester}
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
              Espace Académique & Recherche
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Gestion dynamique des crédits ECTS, calcul GPA aux normes internationales et suivi des livrables techniques.
            </p>
          </div>

          {/* INDICATEURS GLASS GPA */}
          <div className="grid grid-cols-3 gap-3 bg-slate-100/80 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Moyenne LMD</p>
              <p className="text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {academicMetrics.averageOn20}<span className="text-xs text-slate-400 dark:text-slate-500">/20</span>
              </p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-white/10 px-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">GPA Int.</p>
              <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {academicMetrics.gpaEquivalent}<span className="text-xs text-slate-400 dark:text-slate-500">/4.0</span>
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Crédits</p>
              <p className="text-xl lg:text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {academicMetrics.totalCredits} <span className="text-xs text-slate-400 dark:text-slate-500">ECTS</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTROLES ET BARRE DE RECHERCHE ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        {/* Navigation Tabs */}
        <div className="flex bg-white/80 dark:bg-white/5 backdrop-blur-md p-1 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-200 dark:border-white/10">
          {[
            { id: 'overview', label: 'Vue d’ensemble', icon: BookOpen },
            { id: 'courses', label: 'Modules', icon: GraduationCap },
            { id: 'assignments', label: 'Devoirs & TP', icon: CheckSquare },
            { id: 'resources', label: 'Bibliothèque', icon: FolderDown },
            { id: 'grades', label: 'Relevé & GPA', icon: BarChart3 },
            { id: 'formations', label: 'Formations & Certifications', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Moteur de Recherche */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un module, TP, syllabus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur-md"
          />
        </div>
      </div>

      {/* ================= TAB 1: VUE D'ENSEMBLE ================= */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* PROCHAINS COURS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Planning des Cours Inscrits
                </h2>
                <button onClick={() => setShowAddCourseModal(true)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Ajouter un cours
                </button>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center text-slate-500 dark:text-slate-400 text-xs">
                  Aucun cours enregistré. Cliquez sur "Ajouter un cours" pour structurer votre programme.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="p-5 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-4 relative group">
                      <button onClick={() => deleteCourse(course.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                          {course.code}
                        </span>
                        {course.isCertificationTrack && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Certif
                          </span>
                        )}
                        <span className="ml-auto text-[10px] font-mono text-slate-500 dark:text-slate-400">{course.credits} ECTS</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{course.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.professor || 'Enseignant non assigné'} • {course.hours}h</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> {course.nextSession || 'Horaires à préciser'}</p>
                        <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> {course.room || 'Salle non définie'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE : DEVOIRS URGENTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Devoirs à Rendre
              </h2>
              <button onClick={() => setShowAddAssignmentModal(true)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Nouveau TP
              </button>
            </div>

            <div className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="p-6 rounded-3xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center text-slate-500 dark:text-slate-400 text-xs">
                  Aucun devoir à rendre pour le moment.
                </div>
              ) : (
                filteredAssignments.map((ass) => (
                  <div key={ass.id} className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/30">
                        {ass.type} • {ass.courseCode}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{ass.dueDate}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{ass.title}</h4>
                    <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">Statut: {ass.status}</span>
                      {ass.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(ass);
                            setShowSubmitModal(true);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-[10px] flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" /> Remettre
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= TAB 2: MODULES DE COURS ================= */}
      {activeTab === 'courses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Syllabus & Unités d'Enseignement</h2>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Ajouter un Module
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="p-6 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                      {course.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">{course.title}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/5 font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                    {course.credits} ECTS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-100 dark:bg-black/35 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Enseignant</p>
                    <p className="text-slate-900 dark:text-slate-200 font-semibold">{course.professor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Volume Horaire</p>
                    <p className="text-slate-900 dark:text-slate-200 font-semibold">{course.hours} Heures</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold border border-red-500/20"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ================= TAB 3: DEVOIRS ET LABS ================= */}
      {activeTab === 'assignments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Travaux Pratiques & Évaluations</h2>
            <button
              onClick={() => setShowAddAssignmentModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Créer un Devoir
            </button>
          </div>

          <div className="space-y-3">
            {filteredAssignments.map((ass) => (
              <div key={ass.id} className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {ass.courseCode}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{ass.type}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ass.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Échéance: {ass.dueDate}</p>
                </div>

                <div className="flex items-center gap-3">
                  {ass.status === 'pending' ? (
                    <button
                      onClick={() => {
                        setSelectedAssignment(ass);
                        setShowSubmitModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> Soumettre
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Soumis ({ass.submittedFileName})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ================= TAB 4: BIBLIOTHÈQUE ET RESSOURCES ================= */}
      {activeTab === 'resources' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Supports de Cours & Fichiers de Lab</h2>
            <button
              onClick={() => setShowAddResourceModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Ajouter un Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => (
              <div key={res.id} className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold">
                    {res.courseCode} • {res.type}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">{res.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Taille: {res.size} • Ajouté le {res.dateAdded}</p>
                </div>
                <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/10">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'formations' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <PageMeta title="Formations & Certifications" description="Cours et certifications validés par des professionnels." />
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Formations dispensées par des professionnels</h2>
            {proCourses.length === 0 ? (
              <EmptyState
                title="Aucune formation publiée"
                description="Les formateurs SkillLink Pro publieront ici des cours et tutos."
                icon={Award}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {proCourses.map((c) => (
                  <li key={c.id} className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.author?.full_name || 'Professionnel'}</p>
                    {c.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{c.description}</p>}
                    {c.skills?.length > 0 && (
                      <p className="text-[11px] text-brand-600 mt-2">{c.skills.join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Mes certifications</h2>
            {certifications.length === 0 ? (
              <EmptyState title="Aucune certification" description="Vos certifications validées apparaîtront ici." icon={ShieldCheck} />
            ) : (
              <ul className="space-y-2">
                {certifications.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm">
                    <span>{c.title}</span>
                    <span className="text-xs font-bold uppercase text-slate-500">{c.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </motion.div>
      )}

      {/* ================= TAB 5: RELEVÉ DE NOTES DYNAMIQUE ET GPA ================= */}
      {activeTab === 'grades' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Saisie des Notes & Calculation GPA</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pondération standard LMD : CC (40%) + Examen Final (60%)</p>
              </div>

              <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setSelectedSemester('S1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSemester === 'S1' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Semestre 1
                </button>
                <button
                  onClick={() => setSelectedSemester('S2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSemester === 'S2' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Semestre 2
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-mono font-bold">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Module</th>
                    <th className="p-3.5">Crédits</th>
                    <th className="p-3.5">Note CC (/20)</th>
                    <th className="p-3.5">Note Examen (/20)</th>
                    <th className="p-3.5">Moyenne UE</th>
                    <th className="p-3.5">Grade US</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-medium">
                  {courses.filter((c) => c.semester === selectedSemester).map((course) => {
                    const record = grades[course.id] || { ccGrade: 0, examGrade: 0 };
                    const finalUE = record.ccGrade * 0.4 + record.examGrade * 0.6;
                    const pct = (finalUE / 20) * 100;

                    let gradeLetter = 'F';
                    if (pct >= 80) gradeLetter = 'A (4.0)';
                    else if (pct >= 70) gradeLetter = 'B (3.0)';
                    else if (pct >= 60) gradeLetter = 'C (2.0)';
                    else if (pct >= 50) gradeLetter = 'D (1.0)';

                    return (
                      <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{course.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-200">{course.title}</td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{course.credits} ECTS</td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={record.ccGrade}
                            onChange={(e) => handleUpdateGrade(course.id, 'ccGrade', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={record.examGrade}
                            onChange={(e) => handleUpdateGrade(course.id, 'examGrade', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{finalUE.toFixed(2)} / 20</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${finalUE >= 10 ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'}`}>
                            {gradeLetter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= MODALE 1 : AJOUT DE COURS ================= */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Nouveau Module Académique</h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Code du cours (ex: NET101)</label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Intitulé du cours</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Crédits (ECTS)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Semestre</label>
                  <select
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    <option value="S1">Semestre 1</option>
                    <option value="S2">Semestre 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Professeur Référent</label>
                <input
                  type="text"
                  value={newCourse.professor}
                  onChange={(e) => setNewCourse({ ...newCourse, professor: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="certif"
                  checked={newCourse.isCertificationTrack}
                  onChange={(e) => setNewCourse({ ...newCourse, isCertificationTrack: e.target.checked })}
                  className="rounded bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10"
                />
                <label htmlFor="certif" className="text-slate-700 dark:text-slate-300 font-bold">Module avec certification (ex: Cisco, RedHat)</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE 2 : AJOUT DE DEVOIR ================= */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Nouveau Devoir ou TP</h3>
              <button onClick={() => setShowAddAssignmentModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddAssignment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Code du cours concerné</label>
                <input
                  type="text"
                  required
                  placeholder="ex: NET101"
                  value={newAssignment.courseCode}
                  onChange={(e) => setNewAssignment({ ...newAssignment, courseCode: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Titre du devoir / TP</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Date d'échéance</label>
                <input
                  type="date"
                  required
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddAssignmentModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">Créer le TP</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE 3 : AJOUT DE RESSOURCE ================= */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Ajouter un Document</h3>
              <button onClick={() => setShowAddResourceModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddResource} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Code du cours</label>
                <input
                  type="text"
                  required
                  value={newResource.courseCode}
                  onChange={(e) => setNewResource({ ...newResource, courseCode: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Titre du document</label>
                <input
                  type="text"
                  required
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">Type de fichier</label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
                >
                  <option value="PDF">Document PDF</option>
                  <option value="ZIP">Archive ZIP</option>
                  <option value="LAB">Fichier Lab (PKT / GNS3)</option>
                  <option value="LINK">Lien web</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddResourceModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE 4 : SOUMISSION DE DEVOIR ================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Remise du devoir : {selectedAssignment?.title}</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 text-center space-y-3 bg-slate-50 dark:bg-black/20 hover:border-indigo-500/50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'Sélectionnez le fichier du TP à rendre'}
              </p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />
              <label htmlFor="file-upload" className="inline-block px-4 py-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold cursor-pointer hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-colors border border-indigo-500/30">
                {selectedFile ? 'Changer de fichier' : 'Parcourir'}
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold">Annuler</button>
              <button onClick={handleConfirmSubmit} disabled={!selectedFile} className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/30">Valider la remise</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}