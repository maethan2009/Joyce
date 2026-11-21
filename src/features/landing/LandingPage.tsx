import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Marquee from 'react-fast-marquee';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Compass,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  X,
} from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export function LandingPage() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'contact'>('privacy');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [searchMatricule, setSearchMatricule] = useState('');

  const openInfoDrawer = (tab: 'privacy' | 'terms' | 'contact') => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchMatricule.trim();
    if (!cleaned) return;
    navigate(`/enroll?matricule=${encodeURIComponent(cleaned)}`);
  };

  const schoolLogos = [
    { name: 'IAI-Cameroun', src: '/logos/iai.png' },
    { name: 'IUGET Douala', src: '/logos/iuget.png' },
    { name: 'UCAC', src: '/logos/ucac.png' },
    { name: 'Université de Yaoundé I', src: '/logos/uy1.png' },
    { name: 'IUT de Douala', src: '/logos/iut.png' },
    { name: 'JFN', src: '/logos/jfn.png' },
  ];

  const pillars = [
    {
      number: '01',
      title: 'Espace Académique & Vie de Campus',
      description:
        'Suivi des modules, crédits ECTS, devoirs, carte étudiante QR dynamique, calendrier des événements et scrutins universitaires.',
      icon: GraduationCap,
      to: '/login',
    },
    {
      number: '02',
      title: 'Orientation & Avenir',
      description:
        'Annuaire classé des établissements partenaires, bourses d’études camerounaises et internationales, et fiches métiers A–Z.',
      icon: Compass,
      to: '/login',
    },
    {
      number: '03',
      title: 'EduAmis & Messagerie',
      description:
        'Réseau social académique, entraide par compétences sur SkillLink et messagerie directe chiffrée entre membres vérifiés.',
      icon: MessageSquare,
      to: '/login',
    },
    {
      number: '04',
      title: 'Portail Pro, Formations & Admin',
      description:
        'Publication de formations certifiantes par les recruteurs, validation de comptes et gouvernance de l’établissement.',
      icon: Briefcase,
      to: '/enroll',
    },
  ];

  const faqItems = [
    {
      q: 'Comment activer mon accès étudiant vérifié sur EduCampus ?',
      a: 'Saisissez votre matricule officiel et votre email institutionnel dans la page d’activation. Une fois confirmé dans le registre de votre école, votre profil et votre carte numérique sont immédiatement activés.',
    },
    {
      q: 'Puis-je utiliser EduCampus sans matricule d’établissement ?',
      a: 'Oui. L’inscription « Étudiant Libre » donne un accès immédiat au pilier Orientation & Avenir, à EduAmis, à SkillLink et à la messagerie directe.',
    },
    {
      q: 'Comment fonctionne la vérification de la carte étudiante QR ?',
      a: 'La carte génère un jeton TOTP dynamique toutes les 30 secondes intégré au QR code, vérifiable hors-ligne et sans falsification.',
    },
    {
      q: 'Comment les écoles et partenaires professionnels rejoignent-ils le portail ?',
      a: 'Lors de l’inscription, choisissez « Établissement » ou « Partenaire Pro ». Un administrateur de la plateforme valide votre organisation pour activer vos outils dédiés.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 border border-brand-700">
              <img
                src="/logo-educampus-icon.svg"
                alt="EduCampus"
                className="h-6 w-6 object-contain brightness-0 invert"
              />
            </div>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white">
                EduCampus
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 -mt-0.5">
                Portail Universitaire
              </p>
            </div>
          </Link>

          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <a href="#pillars" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Les 4 Piliers
            </a>
            <a href="#campus" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Établissements
            </a>
            <a href="#mobile-app" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              PWA Mobile
            </a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary hidden sm:inline-flex">
              Connexion
            </Link>
            <Link to="/enroll" className="btn-primary">
              Rejoindre
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 lg:py-24 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Plateforme Académique Multi-Portails
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.08]">
                Toute la vie de campus,{' '}
                <span className="text-brand-600 dark:text-brand-400">unifiée et vérifiée.</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                EduCampus réunit la gestion académique, l’orientation universitaire, le réseau d’entraide EduAmis et les portails écoles & entreprises dans une architecture rigoureuse.
              </p>

              <form
                onSubmit={handleSearchSubmit}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-card flex flex-col sm:flex-row gap-2 max-w-xl focus-within:border-brand-600"
              >
                <div className="flex-1 flex items-center gap-3 px-3 py-2">
                  <Search className="w-4 h-4 text-brand-600 shrink-0" />
                  <input
                    type="text"
                    value={searchMatricule}
                    onChange={(e) => setSearchMatricule(e.target.value)}
                    placeholder="Saisissez votre matricule officiel…"
                    className="bg-transparent border-none outline-none w-full text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-sm font-medium"
                  />
                </div>
                <button type="submit" className="btn-primary py-3 px-5 shrink-0">
                  <span>Vérifier mon accès</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400 font-medium pt-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Matricules officiels vérifiés</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Contrôle d’accès RLS & TOTP</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-2.5 shadow-cabinet relative">
                <div className="rounded-xl overflow-hidden relative">
                  <img
                    src="/hero-student.jpeg"
                    alt="Étudiant EduCampus"
                    className="w-full h-[460px] object-cover object-top"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 text-white">
                    <div className="p-3 bg-brand-600 text-white rounded-lg shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-brand-300 font-bold tracking-wider uppercase">
                        Identité Numérique Certifiée
                      </p>
                      <p className="text-sm font-bold text-white">
                        Badge QR dynamique & accès multi-portails
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Établissements */}
      <section id="campus" className="py-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
          <p className="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
            Établissements & Campus Compatibles
          </p>
        </div>

        <Marquee gradient={false} autoFill pauseOnHover speed={32}>
          {schoolLogos.map((school, index) => (
            <div
              key={`${school.name}-${index}`}
              className="mx-5 flex h-20 w-44 shrink-0 items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <img
                src={school.src}
                alt={school.name}
                className="max-h-12 max-w-full object-contain"
              />
            </div>
          ))}
        </Marquee>
      </section>

      {/* Les 4 Piliers */}
      <section id="pillars" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-2">
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase">
              Architecture en 4 Sous-Groupes
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Une plateforme structurée de bout en bout
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Chaque profil accède aux modules correspondant à son statut académique ou professionnel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="card-base p-7 flex flex-col justify-between gap-5 hover:border-brand-600 dark:hover:border-brand-500 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        PILIER {pillar.number}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-zinc-950 dark:text-white">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      to={pillar.to}
                      className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <span>Accéder au portail</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PWA Mobile */}
      <section id="mobile-app" className="py-20 bg-zinc-950 text-white border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 p-2">
                <img
                  src="/study-student.jpg"
                  alt="Application EduCampus Mobile"
                  className="w-full h-[360px] object-cover rounded-xl"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block rounded border border-brand-700 bg-brand-950 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-300">
                Application Web Progressive (PWA)
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Votre campus disponible partout, même hors connexion
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                Présentez votre badge étudiant QR aux examens et accédez à vos supports téléchargés sans dépendre du réseau mobile.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Badge QR autonome 30 secondes</p>
                    <p className="text-xs text-zinc-400">
                      Génération cryptographique TOTP synchronisée sur votre appareil.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Synchronisation Supabase en direct</p>
                    <p className="text-xs text-zinc-400">
                      Notes, messages directs et annonces actualisés dès publication.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/enroll" className="btn-primary py-3 px-6">
                  <Smartphone className="w-4 h-4" />
                  <span>Activer mon accès</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase">
              Questions Fréquentes
            </p>
            <h2 className="font-display text-3xl font-extrabold">Informations essentielles</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className="card-base overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-brand-600 transition-transform duration-200 shrink-0 ${
                      openFaqIndex === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 sm:p-12 bg-brand-600 text-white border border-brand-700 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                Prêt à accéder à votre espace EduCampus ?
              </h2>
              <p className="text-brand-100 text-sm">
                Connectez-vous avec votre compte existant ou créez un accès étudiant, établissement ou partenaire pro.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/login" className="px-5 py-3 rounded-lg bg-zinc-950 text-white hover:bg-zinc-900 font-semibold text-sm transition-colors">
                Connexion
              </Link>
              <button
                type="button"
                onClick={() => openInfoDrawer('contact')}
                className="px-5 py-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-sm transition-colors"
              >
                Contacter l’équipe
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Drawer d'information */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-6 shadow-cabinet flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    {activeTab === 'privacy' && <ShieldCheck className="w-5 h-5 text-brand-600" />}
                    {activeTab === 'terms' && <FileText className="w-5 h-5 text-brand-600" />}
                    {activeTab === 'contact' && <Mail className="w-5 h-5 text-brand-600" />}
                    {activeTab === 'privacy' && 'Confidentialité'}
                    {activeTab === 'terms' && 'Conditions d’Utilisation'}
                    {activeTab === 'contact' && 'Support Administrateur'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-5 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {activeTab === 'privacy' && (
                    <p>
                      EduCampus protège vos données académiques via le chiffrement TLS et des politiques de sécurité par ligne (RLS) sur Supabase.
                    </p>
                  )}
                  {activeTab === 'terms' && (
                    <p>
                      L’accès aux services vérifiés (carte étudiante, votes, relevés) requiert un matricule validé par votre établissement.
                    </p>
                  )}
                  {activeTab === 'contact' && (
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setDrawerOpen(false);
                      }}
                    >
                      <div>
                        <label className="block text-xs font-semibold mb-1">Email institutionnel</label>
                        <input type="email" required placeholder="prenom.nom@ecole.org" className="input-base" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Message</label>
                        <textarea rows={4} required placeholder="Votre demande…" className="input-base" />
                      </div>
                      <button type="submit" className="btn-primary w-full">
                        Envoyer le message
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
                <span>EduCampus Support</span>
                <Link to="/legal" className="text-brand-600 font-semibold hover:underline">
                  Mentions complètes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}