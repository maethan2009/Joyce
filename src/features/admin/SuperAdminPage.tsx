import { useCallback, useEffect, useState } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { adminService, orientationService } from '@/services';
import type { Profile, Scholarship, School } from '@/types';

export function SuperAdminPage() {
  const addToast = useAppStore((s) => s.addToast);
  const [pending, setPending] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'validation' | 'ecoles' | 'bourses' | 'metiers'>('validation');

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    slug: '',
    city: '',
    category: 'TIC',
    ranking_position: '',
    why_top: '',
    is_published: true,
  });
  const [scholarshipForm, setScholarshipForm] = useState({
    title: '',
    region: 'cameroun' as Scholarship['region'],
    description: '',
    is_published: true,
  });
  const [careerForm, setCareerForm] = useState({
    name: '',
    slug: '',
    letter: 'A',
    missions: '',
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([adminService.listPendingAccounts(), orientationService.listSchools()]);
      setPending(p);
      setSchools(s);
    } catch {
      setPending([]);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const validate = async (id: string, approve: boolean) => {
    try {
      await adminService.validateAccount(id, approve);
      addToast('success', approve ? 'Compte approuvé.' : 'Compte rejeté.');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la validation.');
    }
  };

  const saveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.upsertSchool({
        name: schoolForm.name,
        slug: schoolForm.slug || schoolForm.name.toLowerCase().replace(/\s+/g, '-'),
        city: schoolForm.city || null,
        category: schoolForm.category,
        ranking_position: schoolForm.ranking_position ? Number(schoolForm.ranking_position) : null,
        why_top: schoolForm.why_top || null,
        is_published: schoolForm.is_published,
        advantages: [],
        disadvantages: [],
        country: 'Cameroun',
        elections_enabled: false,
        mentorship_enabled: false,
      } as Partial<School> & { name: string; slug: string });
      addToast('success', 'École enregistrée.');
      setSchoolForm({
        name: '',
        slug: '',
        city: '',
        category: 'TIC',
        ranking_position: '',
        why_top: '',
        is_published: true,
      });
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const saveScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.upsertScholarship(scholarshipForm);
      addToast('success', 'Bourse enregistrée.');
      setScholarshipForm({ title: '', region: 'cameroun', description: '', is_published: true });
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const saveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.upsertCareer({
        ...careerForm,
        letter: careerForm.letter.trim().slice(0, 1).toUpperCase(),
        slug: careerForm.slug || careerForm.name.toLowerCase().replace(/\s+/g, '-'),
        advantages: [],
        disadvantages: [],
      });
      addToast('success', 'Métier enregistré.');
      setCareerForm({ name: '', slug: '', letter: 'A', missions: '', is_published: true });
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageMeta
        title="Super Administration"
        description="Validation des comptes et gestion Orientation (écoles, bourses, métiers)."
      />

      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="h-11 w-11 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pilier 4 · Gouvernance Plateforme
          </p>
          <h1 className="font-display text-2xl font-extrabold text-zinc-950 dark:text-white">Super Admin</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Validation des comptes · Catalogue Orientation
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['validation', 'Validations'],
            ['ecoles', 'Écoles'],
            ['bourses', 'Bourses'],
            ['metiers', 'Métiers'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tab === 'validation' ? (
        pending.length === 0 ? (
          <EmptyState
            title="Aucun compte en attente"
            description="Les demandes school_admin et pro_recruiter apparaîtront ici."
            icon={Shield}
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950 dark:text-white">{p.full_name}</p>
                  <p className="text-xs text-zinc-500">
                    {p.role}
                    {p.company_name ? ` · ${p.company_name}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => void validate(p.id, true)}>
                    <Check className="h-4 w-4" /> Approuver
                  </button>
                  <button type="button" className="btn-danger" onClick={() => void validate(p.id, false)}>
                    <X className="h-4 w-4" /> Rejeter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : tab === 'ecoles' ? (
        <div className="space-y-4">
          <form onSubmit={saveSchool} className="card-base p-5 space-y-3">
            <h2 className="font-display font-bold text-zinc-950 dark:text-white">
              Ajouter / mettre à jour une école
            </h2>
            <input
              className="input-base"
              placeholder="Nom"
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              required
            />
            <input
              className="input-base"
              placeholder="Slug (url)"
              value={schoolForm.slug}
              onChange={(e) => setSchoolForm({ ...schoolForm, slug: e.target.value })}
            />
            <div className="grid sm:grid-cols-3 gap-2">
              <input
                className="input-base"
                placeholder="Ville"
                value={schoolForm.city}
                onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
              />
              <input
                className="input-base"
                placeholder="Catégorie"
                value={schoolForm.category}
                onChange={(e) => setSchoolForm({ ...schoolForm, category: e.target.value })}
              />
              <input
                className="input-base"
                placeholder="Rang"
                type="number"
                value={schoolForm.ranking_position}
                onChange={(e) => setSchoolForm({ ...schoolForm, ranking_position: e.target.value })}
              />
            </div>
            <textarea
              className="input-base"
              placeholder="Pourquoi Top ?"
              value={schoolForm.why_top}
              onChange={(e) => setSchoolForm({ ...schoolForm, why_top: e.target.value })}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enregistrer
            </button>
          </form>
          {schools.length === 0 ? (
            <EmptyState title="Aucune école publiée" />
          ) : (
            <ul className="text-sm space-y-2">
              {schools.map((s) => (
                <li key={s.id} className="card-base px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {s.ranking_position != null ? `#${s.ranking_position} · ` : ''}
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === 'bourses' ? (
        <form onSubmit={saveScholarship} className="card-base p-5 space-y-3">
          <h2 className="font-display font-bold text-zinc-950 dark:text-white">Catalogue des bourses</h2>
          <input
            className="input-base"
            placeholder="Titre"
            value={scholarshipForm.title}
            onChange={(e) => setScholarshipForm({ ...scholarshipForm, title: e.target.value })}
            required
          />
          <select
            className="input-base"
            value={scholarshipForm.region}
            onChange={(e) => setScholarshipForm({ ...scholarshipForm, region: e.target.value as Scholarship['region'] })}
          >
            <option value="cameroun">Cameroun</option>
            <option value="afrique">Afrique</option>
            <option value="international">International</option>
          </select>
          <textarea
            className="input-base"
            placeholder="Description"
            value={scholarshipForm.description}
            onChange={(e) => setScholarshipForm({ ...scholarshipForm, description: e.target.value })}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            Enregistrer la bourse
          </button>
        </form>
      ) : (
        <form onSubmit={saveCareer} className="card-base p-5 space-y-3">
          <h2 className="font-display font-bold text-zinc-950 dark:text-white">Métiers A–Z</h2>
          <div className="grid sm:grid-cols-[80px_1fr] gap-2">
            <input
              className="input-base"
              maxLength={1}
              placeholder="A"
              value={careerForm.letter}
              onChange={(e) => setCareerForm({ ...careerForm, letter: e.target.value })}
              required
            />
            <input
              className="input-base"
              placeholder="Nom du métier"
              value={careerForm.name}
              onChange={(e) => setCareerForm({ ...careerForm, name: e.target.value })}
              required
            />
          </div>
          <textarea
            className="input-base"
            placeholder="Missions"
            value={careerForm.missions}
            onChange={(e) => setCareerForm({ ...careerForm, missions: e.target.value })}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            Enregistrer le métier
          </button>
        </form>
      )}
    </div>
  );
}
