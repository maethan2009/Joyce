"use client";

import React, { useState, useEffect, useRef } from 'react';
import Marquee from 'react-fast-marquee';
import { 
  BookOpen, 
  QrCode, 
  Users, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  HeartPulse, 
  BellRing, 
  Sparkles, 
  ChevronDown, 
  X, 
  Mail, 
  FileText,
  UserCheck,
  Smartphone
} from 'lucide-react';

function MouseTrailBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const points: Array<{ x: number; y: number; age: number; maxAge: number; size: number }> = [];

    const handleMouseMove = (e: MouseEvent) => {
      points.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
        maxAge: 50,
        size: 140
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.age++;

        const alpha = 1 - p.age / p.maxAge;
        const currentSize = p.size * (1 - p.age / (p.maxAge * 1.4));

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha * 0.22})`);
        gradient.addColorStop(0.4, `rgba(168, 85, 247, ${alpha * 0.12})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = points.length - 1; i >= 0; i--) {
        if (points[i].age >= points[i].maxAge) {
          points.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 backdrop-blur-[20px]"
    />
  );
}

export function LandingPage() {
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
    if (!searchMatricule.trim()) return;
    window.location.href = `/enroll?matricule=${encodeURIComponent(searchMatricule)}`;
  };

  const schoolLogos = [
    { name: "IAI-Cameroun", src: "/logos/iai.png" },
    { name: "IUGET Douala", src: "/logos/iuget.png" },
    { name: "UCAC", src: "/logos/ucac.png" },
    { name: "Université de Yaoundé I", src: "/logos/uy1.png" },
    { name: "IUT de Douala", src: "/logos/iut.png" },
  ];

  const faqItems = [
    {
      q: "Comment activer ma carte d'étudiant numérique EduCampus ?",
      a: "Saisissez votre matricule officiel dans la barre de recherche. Une fois votre identité vérifiée auprès du serveur de votre établissement, votre badge QR sécurisé est automatiquement généré."
    },
    {
      q: "Quels établissements supportent la carte numérique ?",
      a: "EduCampus est interconnecté avec les bases de données de l'IAI-Cameroun, IUGET, UCAC, UY1 et IUT de Douala. D'autres instituts sont régulièrement ajoutés."
    },
    {
      q: "Comment fonctionne la fiche médicale d'urgence ?",
      a: "Au dos de votre profil QR se trouve une fiche chiffrée regroupant votre groupe sanguin, vos allergies et un contact à prévenir. Seul le service médical du campus possède la clé de lecture."
    },
    {
      q: "Le réseau SkillLink est-il gratuit ?",
      a: "Oui, SkillLink est un service d'entraide et de mentorat entièrement gratuit intégré à la plateforme pour favoriser le soutien académique entre étudiants."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      <MouseTrailBackground />

      {/* ----------------- HEADER / NAVBAR ----------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 border-b border-slate-200/85 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          
          {/* Logo agrandi avec logo-educampus-main.svg */}
          <a href="#" className="flex items-center shrink-0 group py-1">
            <img 
              src="/logo-educampus.svg" 
              alt="EduCampus Logo" 
              className="h-16 sm:h-20 w-auto max-w-[220px] object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo-educampus.png";
              }}
            />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Fonctionnalités
            </a>
            <a href="#campus" className="hover:text-indigo-600 transition-colors">Établissements</a>
            <a href="#mobile-app" className="hover:text-indigo-600 transition-colors">PWA Mobile</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Connexion
            </a>
            <a 
              href="/enroll" 
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              Rejoindre mon Campus
            </a>
          </div>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 backdrop-blur-sm border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Plateforme Universitaire & Badge Étudiant Officiel
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Toute votre vie académique, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  centralisée & sécurisée.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                EduCampus numérise vos démarches universitaires : badge d'étudiant QR vérifié, suivi des notes, réseau de mentorat SkillLink et fiche médicale d'urgence.
              </p>

              <form onSubmit={handleSearchSubmit} className="p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl shadow-indigo-100/50 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                <div className="flex-1 flex items-center gap-3 px-3 py-2 text-slate-400">
                  <Search className="w-5 h-5 text-indigo-600 shrink-0" />
                  <input 
                    type="text" 
                    value={searchMatricule}
                    onChange={(e) => setSearchMatricule(e.target.value)}
                    placeholder="Entrez votre matricule (ex: 26IAI..., IUGET...)" 
                    className="bg-transparent border-none outline-none w-full text-slate-900 placeholder-slate-400 text-sm focus:ring-0 font-medium"
                  />
                </div>
                <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-md shadow-indigo-600/20">
                  Vérifier mon statut <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Matricules officiels vérifiés</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Données académiques chiffrées</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-lg lg:max-w-none">
                <div className="rounded-3xl overflow-hidden border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-2xl relative group p-2.5">
                  <div className="rounded-2xl overflow-hidden relative">
                    <img 
                      src="/hero-student.jpeg" 
                      alt="Étudiant EduCampus" 
                      className="w-full h-[500px] object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 right-6 bg-white/90 border border-slate-200/80 p-4 rounded-2xl backdrop-blur-md shadow-xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-600 font-bold tracking-wide uppercase">Carte Numérique Certifiée</p>
                      <p className="text-sm font-extrabold text-slate-900">Badge QR & Accès Campus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ----------------- LOGO MARQUEE ----------------- */}
      <section id="campus" className="py-12 border-y border-slate-200/80 bg-white/80 backdrop-blur-md overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
          <p className="text-xs font-extrabold tracking-widest text-indigo-600 uppercase">
            Établissements & Campus Partenaires Compatibles
          </p>
        </div>

        <Marquee 
          gradient 
          gradientColor="rgb(255, 255, 255)" 
          gradientWidth={80} 
          autoFill 
          pauseOnHover 
          speed={35}
        >
          {schoolLogos.map((school, index) => (
            <div 
              key={`${school.name}-${index}`} 
              className="mx-6 my-2 flex h-24 w-48 shrink-0 items-center justify-center p-4 rounded-2xl bg-slate-50/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-400 hover:bg-white transition-all duration-300 group"
            >
              <img 
                src={school.src} 
                alt={school.name}
                className="max-h-14 max-w-full object-contain filter contrast-125 drop-shadow-sm group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement && !target.parentElement.querySelector('.fallback-text')) {
                    const textSpan = document.createElement('span');
                    textSpan.className = 'fallback-text text-xs font-black text-indigo-900 text-center px-2';
                    textSpan.innerText = school.name;
                    target.parentElement.appendChild(textSpan);
                  }
                }}
              />
            </div>
          ))}
        </Marquee>
      </section>

      {/* ----------------- FONCTIONNALITÉS ----------------- */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Services Universitaires</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">Conçu pour simplifier votre scolarité</p>
            <p className="text-slate-600 text-sm sm:text-base">
              Accédez à vos données académiques en temps réel et bénéficiez de services numériques intégrés.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 border border-indigo-100 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Carte Étudiante QR</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Générez votre badge numérique infalsifiable pour le contrôle d'accès aux examens, bibliothèques et événements.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 border border-purple-100 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Mentorat SkillLink</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connectez-vous directement avec des parrains des promotions supérieures pour vos travaux dirigés et projets.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-rose-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 border border-rose-100 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Fiche Médicale d'Urgence</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Un profil médical d'urgence (groupe sanguin, allergies, contacts) accessible de manière sécurisée en cas de besoin.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Suivi des Cours & Notes</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Consultez vos plannings de cours, téléchargez les supports de TD et suivez vos évaluations semestrielles.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 border border-amber-100 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Annonces & Flash Info</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Recevez des notifications instantanées lors de reports de cours, rattrapages ou opportunités d'inscriptions.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Authentification Unifiée</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Un portail unique permettant à chaque étudiant de s'authentifier directement avec son matricule propre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- PWA MOBILE ----------------- */}
      <section id="mobile-app" className="py-20 bg-indigo-900/90 backdrop-blur-md text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-800/50 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden border border-indigo-700/60 bg-indigo-950 shadow-2xl relative p-2">
                <img 
                  src="/study-student.jpg" 
                  alt="Application EduCampus Mobile" 
                  className="w-full h-[380px] object-cover rounded-2xl"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-800/80 border border-indigo-700 text-indigo-200 text-xs font-semibold">
                Application Web Progressive (PWA)
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Emportez votre campus partout avec vous
              </h2>
              <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
                Accédez à votre carte d'étudiant et vos cours même sans connexion Internet permanente grâce au mode hors-ligne.
              </p>

              <div className="space-y-4 pt-2 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Mode Hors-Ligne pour la Carte QR</p>
                    <p className="text-xs text-indigo-200">Présentez votre badge à tout moment sans consommer de données mobiles.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Synchronisation Directe</p>
                    <p className="text-xs text-indigo-200">Vos notes et emplois du temps mis à jour immédiatement dès leur publication.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a 
                  href="/enroll" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold text-sm transition-all shadow-lg"
                >
                  <Smartphone className="w-4 h-4" /> Installer la WebApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- FAQ ----------------- */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Questions Fréquentes</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">Des réponses à vos questions</p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-indigo-600 transition-transform duration-200 shrink-0 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- CALL TO ACTION ----------------- */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-indigo-600/90 via-indigo-700/90 to-purple-700/90 backdrop-blur-md text-center shadow-xl text-white">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl sm:text-3xl font-black">Prêt à numériser votre expérience campus ?</h2>
              <p className="text-indigo-100 text-sm">
                Rejoignez dès aujourd'hui les étudiants inscrits sur la plateforme EduCampus.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a href="/enroll" className="px-6 py-3 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-bold text-sm transition-all shadow-md">
                  Créer mon compte étudiant
                </a>
                <button onClick={() => openInfoDrawer('contact')} className="px-6 py-3 rounded-xl bg-indigo-800/80 text-white hover:bg-indigo-800 border border-indigo-500/40 font-semibold text-sm transition-all">
                  Contacter un administrateur
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER (Centrage et structure conservés) ----------------- */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md text-slate-600 text-xs pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            
            <div className="md:col-span-1 flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-3 justify-center">
                <img 
                  src="/logo-educampus.svg" 
                  alt="EduCampus Logo" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/logo-educampus.png"; }}
                />
              </div>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                Plateforme unifiée de gestion de scolarité, cartes d'étudiants numériques et sécurité sur le campus.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-900 uppercase tracking-wider">PRODUIT</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-indigo-600 transition-colors">Carte Étudiante QR</a></li>
                <li><a href="#features" className="hover:text-indigo-600 transition-colors">SkillLink & Mentorat</a></li>
                <li><a href="#features" className="hover:text-indigo-600 transition-colors">Fiche Médicale d'Urgence</a></li>
                <li><a href="#mobile-app" className="hover:text-indigo-600 transition-colors">Application Mobile PWA</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-900 uppercase tracking-wider">RESSOURCES</p>
              <ul className="space-y-2">
                <li><a href="#faq" className="hover:text-indigo-600 transition-colors">Foire aux Questions (FAQ)</a></li>
                <li><button onClick={() => openInfoDrawer('contact')} className="hover:text-indigo-600 transition-colors">Support & Assistance</button></li>
                <li><a href="#campus" className="hover:text-indigo-600 transition-colors">Établissements Partenaires</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-900 uppercase tracking-wider">LÉGAL & SÉCURITÉ</p>
              <ul className="space-y-2">
                <li><button onClick={() => openInfoDrawer('privacy')} className="hover:text-indigo-600 transition-colors">Politique de Confidentialité</button></li>
                <li><button onClick={() => openInfoDrawer('terms')} className="hover:text-indigo-600 transition-colors">Conditions d'Utilisation</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
            <p>© 2026 EduCampus — Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span>Conçu pour les universités</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-indigo-600 font-bold">v1.0.0</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ----------------- DRAWER INFO ----------------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden backdrop-blur-sm bg-slate-900/40">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 p-6 text-slate-700 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {activeTab === 'privacy' && <ShieldCheck className="w-5 h-5 text-indigo-600" />}
                    {activeTab === 'terms' && <FileText className="w-5 h-5 text-purple-600" />}
                    {activeTab === 'contact' && <Mail className="w-5 h-5 text-emerald-600" />}
                    {activeTab === 'privacy' && "Politique de Confidentialité"}
                    {activeTab === 'terms' && "Conditions d'Utilisation"}
                    {activeTab === 'contact' && "Contact Administrateur"}
                  </h3>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-5 space-y-4 text-xs text-slate-600 leading-relaxed">
                  {activeTab === 'privacy' && (
                    <div className="space-y-3">
                      <p>EduCampus garantit le respect strict des données d'identité et académiques.</p>
                    </div>
                  )}
                  {activeTab === 'terms' && (
                    <div className="space-y-3">
                      <p>L'accès à la carte d'étudiant exige la vérification d'un matricule valide.</p>
                    </div>
                  )}
                  {activeTab === 'contact' && (
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setDrawerOpen(false); }}>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Email institutionnel</label>
                        <input type="email" required placeholder="etudiant@domaine.cm" className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:bg-white" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Message</label>
                        <textarea rows={4} required placeholder="Saisissez votre message..." className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:bg-white"></textarea>
                      </div>
                      <button type="submit" className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md">
                        Envoyer
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                <span>EduCampus Support</span>
                <span className="text-indigo-600 font-bold">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}