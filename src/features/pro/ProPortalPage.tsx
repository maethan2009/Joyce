import { useEffect, useState } from 'react';
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

  const reload = async () => {
    if (!user) return;
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
  };

  useEffect(() => {
    void reload();
  }, [user?.id, filter]);

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
      const id = await messagingService.startConversation(
        ownerId,
        'Opportunité SkillLink Pro',
        'Bonjour, votre profil / projet m’intéresse. Pouvons-nous échanger ?',
      );
      addToast('success', 'Conversation ouverte');
      navigate('/messaging');
      void id;
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Contact impossible');
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
      addToast('success', 'Cours publié');
      setCourseForm({ title: '', description: '', skills: '' });
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const validateCert = async (id: string) => {
    if (!user) return;
    try {
      await proService.validateCertification(id, user.id);
      addToast('success', 'Certification validée');
      await reload();
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Erreur');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageMeta
        title="SkillLink Pro"
        description="Parcourez les projets étudiants, contactez des talents et validez des certifications."
      />
      <header>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">EduCampus SkillLink Pro</h1>
        <p className="text-sm text-slate-500 mt-1">
          {profile?.company_name || 'Espace recruteurs & formateurs'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['talents', 'Talents & projets'],
            ['cours', 'Cours & tutos'],
            ['certifs', 'Certifications'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'talents' && (
        <>
          <input
            className="input-base max-w-md"
            placeholder="Filtrer par compétence…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-10">Chargement…</p>
          ) : projects.length === 0 ? (
            <EmptyState title="Aucun projet" description="Les offres SkillLink des étudiants apparaîtront ici." icon={Briefcase} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id} className="card-base p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</h3>
                  <p className="text-xs text-slate-500">{p.owner?.full_name || 'Étudiant'} · {p.category}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{p.description}</p>
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
            <h2 className="font-semibold">Publier un cours / tuto</h2>
            <input className="input-base" placeholder="Titre" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
            <textarea className="input-base" placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
            <input className="input-base" placeholder="Compétences (séparées par des virgules)" value={courseForm.skills} onChange={(e) => setCourseForm({ ...courseForm, skills: e.target.value })} />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publier
            </button>
          </form>
          {courses.length === 0 ? (
            <EmptyState title="Aucun cours publié" />
          ) : (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id} className="card-base px-4 py-3 text-sm">
                  <strong>{c.title}</strong>
                  <span className="text-slate-400"> · {c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'certifs' &&
        (certs.length === 0 ? (
          <EmptyState title="Aucune certification en attente" description="Les demandes de validation apparaîtront ici." />
        ) : (
          <ul className="space-y-3">
            {certs.map((c) => (
              <li key={c.id} className="card-base p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.skills?.join(', ')}</p>
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
