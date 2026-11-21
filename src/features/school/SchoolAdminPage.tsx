import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { schoolAdminService } from '@/services';
import type { EligibleStudent } from '@/types';

export function SchoolAdminPage() {
  const profile = useAppStore((s) => s.profile);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const addToast = useAppStore((s) => s.addToast);
  const [eligible, setEligible] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [elections, setElections] = useState(false);
  const [mentorship, setMentorship] = useState(false);
  const [form, setForm] = useState({
    matricule: '',
    email: '',
    full_name: '',
    filiere: '',
    niveau: '',
  });
  const [schoolDesc, setSchoolDesc] = useState('');

  useEffect(() => {
    if (profile?.school) {
      setElections(profile.school.elections_enabled);
      setMentorship(profile.school.mentorship_enabled);
      setSchoolDesc(profile.school.description || '');
    }
  }, [profile?.school]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await schoolAdminService.listEligible();
        if (active) setEligible(list);
      } catch {
        if (active) setEligible([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const addMatricule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schoolAdminService.upsertEligible({
        ...form,
        matricule: form.matricule.trim(),
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        filiere: form.filiere.trim(),
        niveau: form.niveau.trim(),
      });
      addToast('success', 'Matricule enregistré.');
      setForm({ matricule: '', email: '', full_name: '', filiere: '', niveau: '' });
      setEligible(await schoolAdminService.listEligible());
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de l’ajout.');
    } finally {
      setSaving(false);
    }
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      await schoolAdminService.setModules(elections, mentorship);
      await refreshProfile();
      addToast('success', 'Modules mis à jour.');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const saveSchool = async () => {
    if (!profile?.school_id) {
      addToast('error', 'Aucune école liée à ce compte.');
      return;
    }
    setSaving(true);
    try {
      await schoolAdminService.updateSchool(profile.school_id, { description: schoolDesc });
      await refreshProfile();
      addToast('success', 'Fiche école mise à jour.');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (profile?.account_status === 'pending') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Compte en attente de validation"
          description="Un super administrateur doit approuver votre accès EduCampus School."
          icon={Building2}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <PageMeta
        title="Administration École"
        description="Gestion des matricules éligibles, fiche école et modules Élections / Mentorat."
      />

      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Pilier 4 · Administration Établissement
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
          EduCampus School
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {profile?.school?.name || 'Gestion de votre établissement'}
        </p>
      </header>

      <section className="card-base p-5 space-y-4">
        <h2 className="font-display font-bold text-zinc-950 dark:text-white">Modules étudiants</h2>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={elections}
            onChange={(e) => setElections(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Activer les scrutins et élections étudiantes
        </label>
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={mentorship}
            onChange={(e) => setMentorship(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Activer le Mentorat &amp; Parrainage
        </label>
        <button type="button" className="btn-primary" onClick={() => void saveModules()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer les modules
        </button>
      </section>

      <section className="card-base p-5 space-y-3">
        <h2 className="font-display font-bold text-zinc-950 dark:text-white">Présentation publique de l’école</h2>
        <textarea
          className="input-base min-h-[100px]"
          value={schoolDesc}
          onChange={(e) => setSchoolDesc(e.target.value)}
          placeholder="Description publique de votre établissement"
        />
        <button type="button" className="btn-primary" onClick={() => void saveSchool()} disabled={saving}>
          Mettre à jour la fiche
        </button>
      </section>

      <section className="card-base p-5 space-y-4">
        <h2 className="font-display font-bold text-zinc-950 dark:text-white">Matricules éligibles</h2>
        <form onSubmit={addMatricule} className="grid sm:grid-cols-2 gap-2.5">
          <input
            className="input-base"
            placeholder="Matricule"
            value={form.matricule}
            onChange={(e) => setForm({ ...form, matricule: e.target.value })}
            required
          />
          <input
            className="input-base"
            type="email"
            placeholder="Email officiel"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input-base"
            placeholder="Nom complet"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            className="input-base"
            placeholder="Filière"
            value={form.filiere}
            onChange={(e) => setForm({ ...form, filiere: e.target.value })}
            required
          />
          <input
            className="input-base"
            placeholder="Niveau"
            value={form.niveau}
            onChange={(e) => setForm({ ...form, niveau: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            Ajouter le matricule
          </button>
        </form>

        {loading ? (
          <div className="py-8 flex justify-center text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : eligible.length === 0 ? (
          <EmptyState
            title="Aucun matricule"
            description="Ajoutez les étudiants autorisés à activer un compte vérifié."
          />
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
            {eligible.map((e) => (
              <li key={e.matricule} className="py-2.5 flex justify-between gap-2">
                <span>
                  <strong className="font-mono">{e.matricule}</strong> — {e.full_name}
                  <span className="text-zinc-500"> · {e.filiere} {e.niveau}</span>
                </span>
                <span className={`text-xs font-semibold ${e.is_activated ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {e.is_activated ? 'Activé' : 'En attente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
