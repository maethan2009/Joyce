import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Users,
  Briefcase,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Tag,
  Rocket,
  Zap,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Code2,
  Terminal,
  Layers,
  Send,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';

// Interfaces
interface Project {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  ownerRole: string;
  category: 'Réseaux & Web' | 'Design & UX' | 'Systèmes & DevOps' | 'Data & IA';
  tags: string[];
  membersNeeded: number;
  membersCount: number;
  status: 'recruiting' | 'in_progress' | 'completed';
  featured?: boolean;
}

interface Peer {
  id: string;
  name: string;
  specialty: string;
  level: string;
  skills: string[];
  synergyScore: number;
  availability: 'Disponible' | 'Occupé' | 'Recherche Projet';
  projectsCompleted: number;
}

interface ServiceOffer {
  id: string;
  title: string;
  provider: string;
  category: string;
  description: string;
  tags: string[];
  type: 'Offre d\'entraide' | 'Mission Freelance';
}

export function SkillLinkPage() {
  const addToast = useAppStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<'projects' | 'peers' | 'services'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // États dynamiques prêts pour Supabase (initialisés à vide)
  const [projects, setProjects] = useState<Project[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [services, setServices] = useState<ServiceOffer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State pour la création de projet
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Réseaux & Web' | 'Design & UX' | 'Systèmes & DevOps' | 'Data & IA'>('Réseaux & Web');
  const [newTags, setNewTags] = useState('');
  const [newMembersNeeded, setNewMembersNeeded] = useState(2);

  // Chargement des données depuis Supabase (Prêt pour implémentation)
  useEffect(() => {
    async function fetchSkillLinkData() {
      setIsLoading(true);
      try {
        // TODO: Remplacer par de vrais fetchs Supabase
        // const { data: projectsData } = await supabase.from('projects').select('*');
        // const { data: peersData } = await supabase.from('profiles').select('*');
        // const { data: servicesData } = await supabase.from('services').select('*');

        // Simulation d'un retour vide ou en attente de BDD
        setProjects([]);
        setPeers([]);
        setServices([]);
      } catch (error) {
        addToast('error', 'Erreur lors du chargement des données SkillLink.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSkillLinkData();
  }, []);

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  const handleCreateProject = () => {
    if (!newTitle || !newDesc) {
      addToast('error', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // TODO: Insérer dans Supabase
    // await supabase.from('projects').insert([{ title: newTitle, description: newDesc, category: newCategory, ... }]);

    const createdProject: Project = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      ownerName: 'Moi (Utilisateur Connecté)',
      ownerRole: 'Porteur de Projet',
      category: newCategory,
      tags: newTags ? newTags.split(',').map(t => t.trim()) : ['Général'],
      membersNeeded: newMembersNeeded,
      membersCount: 1,
      status: 'recruiting'
    };

    setProjects([createdProject, ...projects]);
    addToast('success', 'Votre projet a été publié avec succès sur SkillLink !');
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewTags('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-8">
      {/* EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Zap className="h-4 w-4" /> Réseau d'Excellence & Synergie Étudiante
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            SkillLink Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collaborez sur des projets concrets, trouvez vos coéquipiers techniques et valorisez vos compétences.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Proposer un Projet
        </button>
      </div>

      {/* STATS RAPIDES EN BANDEAU */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Projets Actifs</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{projects.length} en cours</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Talents Inscrits</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{peers.length} Profils</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Taux de Synergie</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Synchronisation</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Services</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{services.length} Actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION D'ONGLETS ET FILTRES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl overflow-x-auto">
          {[
            { id: 'projects', label: 'Projets Collaboratifs', icon: Briefcase },
            { id: 'peers', label: 'Annuaire & Synergie', icon: Users },
            { id: 'services', label: 'Services & Entraide', icon: Rocket }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {activeTab === 'projects' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Réseaux & Web">Réseaux & Web</option>
              <option value="Design & UX">Design & UX</option>
              <option value="Systèmes & DevOps">Systèmes & DevOps</option>
              <option value="Data & IA">Data & IA</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher techno, compétence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* CONTENU : ONGLET 1 - PROJETS COLLABORATIFS */}
      {activeTab === 'projects' && (
        <div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun projet collaboratif pour le moment</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Soyez le premier à proposer un projet et à recruter vos coéquipiers depuis l'IAI-Cameroun !</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Proposer un Projet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`p-6 space-y-5 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden hover:shadow-lg transition-all ${
                    project.featured ? 'ring-1 ring-indigo-500/30' : ''
                  }`}
                >
                  {project.featured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                      Projet Vedette
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                        {project.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {project.membersCount} / {project.membersCount + project.membersNeeded} Membres
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {project.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {project.ownerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{project.ownerName}</p>
                        <p className="text-[10px] text-slate-400">{project.ownerRole}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => addToast('success', `Candidature transmise à ${project.ownerName} !`)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Postuler <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU : ONGLET 2 - ANNUAIRE DES TALENTS */}
      {activeTab === 'peers' && (
        <div>
          {peers.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Annuaire des talents en attente de synchronisation</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Les profils des étudiants inscrits apparaîtront ici dès la connexion à la base de données.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peers.map((peer) => (
                <Card key={peer.id} className="p-6 space-y-5 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {peer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{peer.name}</h3>
                        <p className="text-[11px] text-slate-500">{peer.specialty}</p>
                        <span className="text-[10px] text-indigo-500 font-semibold">{peer.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compatibilité Synergie</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{peer.synergyScore}%</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Compétences clés</p>
                    <div className="flex flex-wrap gap-1.5">
                      {peer.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      peer.availability === 'Disponible' ? 'bg-emerald-500/10 text-emerald-600' :
                      peer.availability === 'Recherche Projet' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {peer.availability}
                    </span>

                    <button
                      onClick={() => addToast('info', `Invitation à collaborer envoyée à ${peer.name}.`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Contacter
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU : ONGLET 3 - SERVICES & ENTRAIDE */}
      {activeTab === 'services' && (
        <div>
          {services.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Rocket className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun service ou offre d'entraide actif</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Proposez votre aide ou vos compétences en freelance pour dynamiser la communauté.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="p-6 space-y-4 border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase">
                      {service.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{service.category}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{service.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{service.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Proposé par : <strong>{service.provider}</strong></span>
                    <button
                      onClick={() => addToast('success', 'Demande envoyée au prestataire !')}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Solliciter
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CRÉATION DE PROJET */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Publier un Nouveau Projet Collaboratif">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Titre du Projet *</label>
            <input
              type="text"
              placeholder="ex: Application Web de Gestion des Notes React/C++..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Domaine / Catégorie</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="Réseaux & Web">Réseaux & Web</option>
              <option value="Design & UX">Design & UX</option>
              <option value="Systèmes & DevOps">Systèmes & DevOps</option>
              <option value="Data & IA">Data & IA</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags / Technologies (séparés par des virgules)</label>
            <input
              type="text"
              placeholder="ex: React, Supabase, Tailwind, Linux..."
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description & Profils recherchés *</label>
            <textarea
              rows={4}
              placeholder="Exposez les objectifs du projet et les compétences requises..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md cursor-pointer"
            >
              Publier l'Annonce
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}