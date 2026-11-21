import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { SiteFooter } from '@/components/SiteFooter';

export function LegalPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#09090B] flex flex-col">
      <PageMeta
        title="Politique de confidentialité & CGU"
        description="Politique de confidentialité, cookies et conditions générales d’utilisation d’EduCampus."
      />
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-educampus-icon.svg" alt="EduCampus" className="h-9 w-9" width={36} height={36} />
            <span className="font-display font-bold text-zinc-950 dark:text-white">EduCampus</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">
          Politique de confidentialité &amp; Conditions générales
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Dernière mise à jour : 21 novembre 2026</p>

        <section className="mt-8 space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">1. Responsable &amp; Infrastructure</h2>
          <p>
            EduCampus est une plateforme académique multi-portails. Les données sont hébergées via Supabase
            (base PostgreSQL protégée par politiques RLS). Aucune clé secrète serveur (<code>service_role</code>) n’est
            exposée dans l’application cliente.
          </p>

          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">2. Données collectées</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identifiants de compte (email, nom complet, rôle, matricule le cas échéant)</li>
            <li>Données académiques et sociales publiées volontairement</li>
            <li>Journaux techniques nécessaires à la sécurité et à la limitation d’abus</li>
          </ul>

          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">3. Cookies</h2>
          <p>
            Les cookies essentiels assurent le maintien de session et les préférences d’affichage. La mesure
            d’audience n’est activée qu’après consentement explicite.
          </p>

          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">4. Vos droits</h2>
          <p>
            Vous pouvez consulter, rectifier ou demander la suppression de vos données depuis Accounts &amp; Settings ou
            auprès de l’administrateur de votre établissement.
          </p>

          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">5. Conditions d’utilisation</h2>
          <p>
            L’usage d’EduCampus doit respecter le règlement intérieur de votre établissement. Les comptes{' '}
            <code>school_admin</code> et <code>pro_recruiter</code> sont soumis à approbation préalable avant
            activation complète.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
