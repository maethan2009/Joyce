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
    (async () => {
      setLoading(true);
      try {
        const list = await schoolAdminService.listEligible();
        setEligible(list);
      } catch {
        setEligible([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addMatricule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schoolAdminService.upsertEligible(form);
      addToast('success', 'Matricule enregistré');
      setForm({ matricule: '', email: '', full_name: '', filiere: '', niveau: '' });
      setEligible(await schoolAdminService.listEligible());
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      await schoolAdminService.setModules(elections, mentorship);
      await refreshProfile();
      addToast('success', 'Modules mis à jour');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
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
      addToast('success', 'Fiche école mise à jour');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
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
      <PageMeta title="EduCampus School" description="Gestion des matricules, fiche école et modules Élections / Mentorat." />
      <header>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">EduCampus School</h1>
        <p className="text-sm text-slate-500 mt-1">
          {profile?.school?.name || 'Administration scolaire'}
        </p>
      </header>

      <section className="card-base p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Modules étudiants</h2>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={elections} onChange={(e) => setElections(e.target.checked)} />
          Activer Élections
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={mentorship} onChange={(e) => setMentorship(e.target.checked)} />
          Activer Mentorat & Parrainage
        </label>
        <button type="button" className="btn-primary" onClick={() => void saveModules()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer les modules
        </button>
      </section>

      <section className="card-base p-5 space-y-3">
        <h2 className="font-semibold">Fiche école</h2>
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
        <h2 className="font-semibold">Matricules éligibles</h2>
        <form onSubmit={addMatricule} className="grid sm:grid-cols-2 gap-2">
          <input className="input-base" placeholder="Matricule" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} required />
          <input className="input-base" type="email" placeholder="Email officiel" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input-base" placeholder="Nom complet" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input className="input-base" placeholder="Filière" value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} required />
          <input className="input-base" placeholder="Niveau" value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} required />
          <button type="submit" className="btn-primary" disabled={saving}>
            Ajouter
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-slate-400">Chargement…</p>
        ) : eligible.length === 0 ? (
          <EmptyState title="Aucun matricule" description="Ajoutez les étudiants autorisés à s’inscrire comme student_verified." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {eligible.map((e) => (
              <li key={e.matricule} className="py-2 flex justify-between gap-2">
                <span>
                  <strong>{e.matricule}</strong> — {e.full_name}
                  <span className="text-slate-400"> · {e.filiere} {e.niveau}</span>
                </span>
                <span className={`text-xs font-semibold ${e.is_activated ? 'text-success-600' : 'text-amber-600'}`}>
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
