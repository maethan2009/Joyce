import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function SiteFooter() {
  const user = useAppStore((s) => s.user);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Identité & Architecture */}
          <div className="lg:col-span-4 space-y-4">
            <Link to={user ? '/dashboard' : '/'} className="inline-flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white border border-brand-500">
                <img
                  src="/logo-educampus-icon.svg"
                  alt="EduCampus"
                  className="h-6 w-6 object-contain brightness-0 invert"
                  loading="lazy"
                />
              </div>
              <div>
                <span className="font-display text-lg font-extrabold tracking-tight text-white">EduCampus</span>
                <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Infrastructure Campus Multi-Portails
                </p>
              </div>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              Plateforme académique centralisée pour les établissements, étudiants vérifiés, réseaux d’entraide et partenaires professionnels.
            </p>
            <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Sessions chiffrées & contrôle d’accès par rôle</span>
            </div>
          </div>

          {/* Pilier 1 & 2 */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
              Académique & Orientation
            </h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors inline-flex items-center gap-1">
                  Tableau de bord campus
                </Link>
              </li>
              <li>
                <Link to="/hub" className="hover:text-white transition-colors">
                  Espace Académique & Ressources
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Calendrier & Événements
                </Link>
              </li>
              <li>
                <Link to="/elections" className="hover:text-white transition-colors">
                  Scrutins & Gouvernance
                </Link>
              </li>
              <li>
                <Link to="/orientation" className="hover:text-white transition-colors">
                  Orientation, Bourses & Métiers
                </Link>
              </li>
            </ul>
          </div>

          {/* Pilier 3 & 4 */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
              Réseau, Pro & Administration
            </h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link to="/eduamis" className="hover:text-white transition-colors">
                  EduAmis & Publications
                </Link>
              </li>
              <li>
                <Link to="/skilllink" className="hover:text-white transition-colors">
                  SkillLink & Talents
                </Link>
              </li>
              <li>
                <Link to="/messaging" className="hover:text-white transition-colors">
                  Messagerie Directe
                </Link>
              </li>
              <li>
                <Link to="/pro" className="hover:text-white transition-colors">
                  Portail Pro & Certifications
                </Link>
              </li>
              <li>
                <Link to="/school" className="hover:text-white transition-colors">
                  Portail Établissement
                </Link>
              </li>
            </ul>
          </div>

          {/* Accès & Légal */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
              Accès & Conformité
            </h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              {user ? (
                <>
                  <li>
                    <Link to="/settings" className="hover:text-white transition-colors">
                      Comptes & Paramètres
                    </Link>
                  </li>
                  <li>
                    <Link to="/student-card" className="hover:text-white transition-colors">
                      Carte Étudiante
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-white transition-colors inline-flex items-center gap-1">
                      Connexion <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/enroll" className="hover:text-white transition-colors inline-flex items-center gap-1">
                      Créer un accès <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/legal" className="hover:text-white transition-colors">
                  Confidentialité & CGU
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-zinc-900 bg-black/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© {year} EduCampus. Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            <Link to="/legal" className="hover:text-zinc-300 transition-colors">
              Mentions légales
            </Link>
            <Link to="/orientation" className="hover:text-zinc-300 transition-colors">
              Établissements & Bourses
            </Link>
            <span className="font-mono text-[11px] text-zinc-600">Bordeaux / Noir / Blanc</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
