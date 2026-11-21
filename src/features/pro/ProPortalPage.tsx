import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Loader2, MessageSquare, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { messagingService, proService } from '@/services';
import type { Certification, ProfessionalCourse, SkillOffer } from '@/types';

export function ProPortalPage() {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'talents' | 'cours' | 'certifs'>('talents');
  const [filter, setFilter] = useState('');
  const [projects, setProjects] = useState<SkillOffer[]>([]);
  const [courses, setCourses] = useState<ProfessionalCourse[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', skills: '' });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, c, cert] = await Promise.all([
        proService.listTalentProjects(filter || undefined),
        proService.listMyCourses(user.id),
        proService.listPendingCertifications(),
      ]);
      setProjects(p);
      setCourses(c);
      setCerts(cert);
    } catch {
      setProjects([]);
      setCourses([]);
      setCerts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (profile?.account_status === 'pending') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Compte recruteur en attente"
          description="Votre accès SkillLink Pro sera activé après validation par le super administrateur."
          icon={Briefcase}
        />
      </div>
    );
  }

  const contact = async (ownerId: string) => {
    try {
      await messagingService.startConversation(
        ownerId,
        'Opportunité SkillLink Pro',
        'Bonjour, votre profil / projet m’intéresse. Pouvons-nous échanger ?',
      );
      addToast('success', 'Conversation ouverte.');
      navigate('/messaging');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Contact impossible.');
    }
  };

  const publishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await proService.publishCourse(user.id, {
        title: courseForm.title,
        description: courseForm.description,
        skills: courseForm.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      addToast('success', 'Cours publié.');
      setCourseForm({ title: '', description: '', skills: '' });
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la publication.');
    } finally {
      setSaving(false);
    }
  };

  const validateCert = async (id: string) => {
    if (!user) return;
    try {
      await proService.validateCertification(id, user.id);
      addToast('success', 'Certification validée.');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur lors de la validation.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageMeta
        title="Portail Pro & Formations"
        description="Parcourez les projets étudiants, publiez des formations et validez des certifications."
      />

      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Pilier 4 · Portail Pro, Formations &amp; Administration
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
          EduCampus Portail Pro
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {profile?.company_name || 'Espace recruteurs, formateurs & certifications'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['talents', 'Talents & projets'],
            ['cours', 'Formations publiées'],
            ['certifs', 'Certifications à valider'],
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

      {tab === 'talents' && (
        <>
          <input
            className="input-base max-w-md"
            placeholder="Filtrer par compétence, mot-clé…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {loading ? (
            <div className="py-12 flex justify-center text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="Aucun projet ou offre"
              description="Les propositions SkillLink des étudiants apparaîtront ici dès publication."
              icon={Briefcase}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id} className="card-base p-5 space-y-2.5">
                  <h3 className="font-display font-bold text-zinc-950 dark:text-white">{p.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {p.owner?.full_name || 'Étudiant'} · {p.category}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{p.description}</p>
                  <button type="button" className="btn-primary mt-2" onClick={() => void contact(p.owner_id)}>
                    <MessageSquare className="h-4 w-4" /> Contacter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'cours' && (
        <div className="space-y-4">
          <form onSubmit={publishCourse} className="card-base p-5 space-y-3">
            <h2 className="font-display font-bold text-zinc-950 dark:text-white">Publier une formation / atelier</h2>
            <input
              className="input-base"
              placeholder="Titre"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              required
            />
            <textarea
              className="input-base"
              placeholder="Description"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
            <input
              className="input-base"
              placeholder="Compétences (séparées par des virgules)"
              value={courseForm.skills}
              onChange={(e) => setCourseForm({ ...courseForm, skills: e.target.value })}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publier
            </button>
          </form>
          {courses.length === 0 ? (
            <EmptyState title="Aucune formation publiée" />
          ) : (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id} className="card-base px-4 py-3 text-sm flex items-center justify-between">
                  <strong className="text-zinc-950 dark:text-white">{c.title}</strong>
                  <span className="text-xs text-zinc-500">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'certifs' &&
        (certs.length === 0 ? (
          <EmptyState
            title="Aucune certification en attente"
            description="Les demandes de validation des étudiants apparaîtront ici."
          />
        ) : (
          <ul className="space-y-3">
            {certs.map((c) => (
              <li key={c.id} className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950 dark:text-white">{c.title}</p>
                  <p className="text-xs text-zinc-500">{c.skills?.join(', ')}</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => void validateCert(c.id)}>
                  <Check className="h-4 w-4" /> Valider
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
