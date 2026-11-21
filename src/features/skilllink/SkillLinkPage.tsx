import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
  Loader2,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/EmptyState';
import { PageMeta } from '@/components/PageMeta';
import { messagingService, skillService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import type { Profile, SkillCategory, SkillOffer } from '@/types';

const categoryLabels: Record<SkillCategory, string> = {
  tutoring: 'Tutorat & Entraide',
  network_support: 'Réseaux & Systèmes',
  graphic_design: 'Design & Interface',
  other: 'Autre / Projet',
};

const statusLabels: Record<SkillOffer['status'], string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  closed: 'Clôturé',
};

export function SkillLinkPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'offers' | 'talents'>('offers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SkillCategory>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [offers, setOffers] = useState<SkillOffer[]>([]);
  const [talents, setTalents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<SkillCategory>('tutoring');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [offerList, talentList] = await Promise.all([
        skillService.listOffers(selectedCategory),
        skillService.listTalentProfiles(),
      ]);
      setOffers(offerList);
      setTalents(talentList.filter((p) => p.id !== user?.id));
    } catch {
      setOffers([]);
      setTalents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return offers.filter((o) => {
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.owner?.full_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [offers, searchQuery]);

  const filteredTalents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return talents.filter((t) => {
      if (!q) return true;
      return (
        t.full_name.toLowerCase().includes(q) ||
        (t.headline ?? '').toLowerCase().includes(q) ||
        (t.filiere ?? '').toLowerCase().includes(q) ||
        (t.skills ?? []).some((sk) => sk.toLowerCase().includes(q))
      );
    });
  }, [talents, searchQuery]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newDesc.trim()) {
      addToast('error', 'Veuillez remplir le titre et la description.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await skillService.createOffer(user.id, {
        category: newCategory,
        title: newTitle.trim(),
        description: newDesc.trim(),
      });
      setOffers((prev) => [created, ...prev]);
      addToast('success', 'Offre publiée sur SkillLink.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewCategory('tutoring');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactMember = async (targetUserId: string, subject: string) => {
    if (!user) return;
    if (targetUserId === user.id) {
      addToast('info', 'Il s’agit de votre propre publication.');
      return;
    }
    try {
      await messagingService.startConversation(
        targetUserId,
        subject,
        `Bonjour, je souhaite échanger avec vous à propos de : ${subject}.`,
      );
      addToast('success', 'Conversation ouverte.');
      navigate('/messaging');
    } catch (ex) {
      addToast('error', ex instanceof Error ? ex.message : 'Impossible d’ouvrir la conversation.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 space-y-6">
      <PageMeta
        title="SkillLink Hub"
        description="Offres de compétences, entraide étudiante et annuaire des talents vérifiés."
      />

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pilier 3 · EduAmis &amp; Synergie
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mt-0.5">
            SkillLink Hub
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Publiez vos offres de services ou collaborations et contactez directement les talents du campus.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Publier une offre
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Offres actives</p>
            <p className="text-lg font-extrabold text-zinc-950 dark:text-white tabular-nums">{offers.length}</p>
          </div>
        </div>

        <div className="card-base p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Talents approuvés</p>
            <p className="text-lg font-extrabold text-zinc-950 dark:text-white tabular-nums">{talents.length}</p>
          </div>
        </div>

        <div className="card-base p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Catégories</p>
            <p className="text-lg font-extrabold text-zinc-950 dark:text-white tabular-nums">4 pôles</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'offers'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4" /> Offres &amp; Projets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('talents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'talents'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> Annuaire des talents
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {activeTab === 'offers' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'all' | SkillCategory)}
              className="input-base sm:w-52 text-xs"
            >
              <option value="all">Toutes les catégories</option>
              {(Object.keys(categoryLabels) as SkillCategory[]).map((key) => (
                <option key={key} value={key}>
                  {categoryLabels[key]}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher compétence, mot-clé…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10 text-xs"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activeTab === 'offers' ? (
        filteredOffers.length === 0 ? (
          <EmptyState
            title="Aucune offre publiée"
            description="Publiez la première proposition de collaboration ou de service sur SkillLink."
            icon={Briefcase}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 text-[10px] font-bold uppercase tracking-wider">
                      {categoryLabels[offer.category] ?? offer.category}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500">
                      {statusLabels[offer.status] ?? offer.status}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white leading-snug">
                    {offer.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center font-bold text-xs">
                      {(offer.owner?.full_name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                        {offer.owner?.full_name || 'Membre EduCampus'}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {offer.owner?.filiere || offer.owner?.headline || 'Profil vérifié'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleContactMember(offer.owner_id, offer.title)}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    Contacter <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredTalents.length === 0 ? (
        <EmptyState
          title="Aucun talent trouvé"
          description="Aucun profil approuvé ne correspond à votre recherche pour le moment."
          icon={Users}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTalents.map((talent) => (
            <Card key={talent.id} className="p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                    {talent.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-zinc-950 dark:text-white text-sm truncate">
                      {talent.full_name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {talent.headline || talent.filiere || talent.role}
                    </p>
                  </div>
                </div>

                {talent.bio && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{talent.bio}</p>
                )}

                {talent.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {talent.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleContactMember(talent.id, `Échange SkillLink — ${talent.full_name}`)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Contacter
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Publier une offre sur SkillLink"
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Titre de l’offre *
            </label>
            <input
              type="text"
              placeholder="ex. Tutorat React / TypeScript ou Architecture Réseau"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input-base"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Catégorie
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as SkillCategory)}
              className="input-base"
            >
              {(Object.keys(categoryLabels) as SkillCategory[]).map((key) => (
                <option key={key} value={key}>
                  {categoryLabels[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description détaillée *
            </label>
            <textarea
              rows={4}
              placeholder="Présentez l’objectif, les compétences attendues ou proposées…"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="input-base"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publier l’offre
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}