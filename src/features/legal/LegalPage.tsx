import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { SiteFooter } from '@/components/SiteFooter';

export function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <PageMeta
        title="Politique de confidentialité & CGU"
        description="Politique de confidentialité, cookies et conditions générales d’utilisation d’EduCampus."
      />
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-educampus-icon.svg" alt="EduCampus" className="h-9 w-9" width={36} height={36} />
            <span className="font-display font-bold text-slate-900 dark:text-slate-100">EduCampus</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-brand-600">
            Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl px-4 py-10 prose prose-slate dark:prose-invert">
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100 !mb-2">
          Politique de confidentialité & Conditions générales
        </h1>
        <p className="text-sm text-slate-500 !mt-0">Dernière mise à jour : 21 novembre 2026</p>

        <section className="mt-8 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">1. Responsable</h2>
          <p>
            EduCampus est une plateforme académique multi-portails. Les données sont hébergées via Supabase
            (base PostgreSQL avec politiques RLS). Aucune clé secrète serveur (`service_role`) n’est exposée
            dans l’application cliente.
          </p>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">2. Données collectées</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identifiants de compte (email, nom, rôle, matricule le cas échéant)</li>
            <li>Données académiques et sociales que vous publiez volontairement</li>
            <li>Logs techniques nécessaires à la sécurité et au rate limiting</li>
          </ul>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">3. Cookies</h2>
          <p>
            Les cookies essentiels assurent l’authentification et les préférences (thème). La mesure
            d’audience n’est activée qu’après acceptation explicite via le bandeau de consentement.
          </p>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">4. Vos droits</h2>
          <p>
            Vous pouvez demander l’accès, la rectification ou la suppression de vos données via les
            paramètres de votre compte ou en contactant l’administrateur de votre établissement.
          </p>

          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">5. Conditions d’utilisation</h2>
          <p>
            L’usage d’EduCampus doit respecter le règlement intérieur de votre établissement. Les comptes
            `school_admin` et `pro_recruiter` nécessitent une validation par le super administrateur avant
            activation complète. Tout abus (spam, usurpation, contenu illicite) peut entraîner une
            suspension.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
