import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Eye, 
  ShieldCheck, 
  Save, 
  Sparkles,
  LockKeyhole,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function SettingsPage() {
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile');

  // Données modifiables par l'étudiant
  const [formData, setFormData] = useState({
    phone: '697530702',
    notifEmail: true,
    notifWhatsapp: true,
    profileVisibility: 'public',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'security' && formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        addToast('error', 'Les nouveaux mots de passe ne correspondent pas.');
        return;
      }
    }
    addToast('success', 'Vos préférences ont été mises à jour avec succès !');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-8 antialiased">
      
      {/* En-tête Liquid Glass */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/90 to-slate-900/90 backdrop-blur-xl border border-white/10 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Centre de Contrôle • EduCampus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
              Paramètres & Préférences
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Consultez votre profil institutionnel et gérez vos préférences personnelles en toute transparence.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Navigation latérale */}
        <div className="md:col-span-4 space-y-2">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            {[
              { id: 'profile', label: 'Profil Académique (Officiel)', icon: User },
              { id: 'security', label: 'Sécurité & Accès', icon: Lock },
              { id: 'notifications', label: 'Notifications & Alertes', icon: Bell },
              { id: 'privacy', label: 'Confidentialité & Visibilité', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Normes Universitaires</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
              Conforme aux standards de sécurité académique et aux protocoles de protection des données étudiantes.
            </p>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="md:col-span-8">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* ONGLET 1 : PROFIL ACADÉMIQUE OFFICIEL */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Identité Institutionnelle</h2>
                      <p className="text-xs text-slate-500">Ces informations officielles sont enregistrées et certifiées par la scolarité.</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Certifié SCOL
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Nom Complet Officiel</span>
                        <span title="Champ verrouillé par l'administration">
                          <LockKeyhole className="w-3 h-3 text-slate-400" />
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.full_name || 'Fanon Ngoga'}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Matricule IAI</span>
                        <span title="Champ verrouillé par l'administration">
                          <LockKeyhole className="w-3 h-3 text-slate-400" />
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value="26IAI1234"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Filière & Spécialité</span>
                        <span title="Champ verrouillé par l'administration">
                          <LockKeyhole className="w-3 h-3 text-slate-400" />
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Systèmes & Réseaux"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Niveau / Classe</span>
                        <span title="Champ verrouillé par l'administration">
                          <LockKeyhole className="w-3 h-3 text-slate-400" />
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Niveau 1 (SR1)"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro WhatsApp Personnel <span className="text-indigo-600 font-normal">(Modifiable pour les notifications)</span>
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+237 6..."
                          className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Utilisé pour les rappels de mentorat et alertes de notes urgentes.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ONGLET 2 : SÉCURITÉ & ACCÈS */}
              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Sécurité du Compte</h2>
                    <p className="text-xs text-slate-500">Mettez à jour votre mot de passe d'accès à la plateforme EduCampus.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mot de passe actuel</label>
                      <input 
                        type="password" 
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        placeholder="••••••••" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="••••••••" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
                      <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ONGLET 3 : NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Préférences de Notification</h2>
                    <p className="text-xs text-slate-500">Choisissez les canaux par lesquels vous souhaitez recevoir les alertes.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Notifications par Email</p>
                        <p className="text-[11px] text-slate-500">Bulletins de notes et communications officielles.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.notifEmail} 
                        onChange={(e) => setFormData({ ...formData, notifEmail: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Rappels WhatsApp & SMS</p>
                        <p className="text-[11px] text-slate-500">Suivi des sessions de mentorat et des événements campus.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.notifWhatsapp} 
                        onChange={(e) => setFormData({ ...formData, notifWhatsapp: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" 
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* ONGLET 4 : CONFIDENTIALITÉ */}
              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Confidentialité & Visibilité</h2>
                    <p className="text-xs text-slate-500">Gérez la façon dont votre profil apparaît dans les annuaires du campus.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visibilité sur le SkillLink Hub</label>
                      <select
                        value={formData.profileVisibility}
                        onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none"
                      >
                        <option value="public">Public (Visible par les étudiants et parrains)</option>
                        <option value="peers">Limité à ma promotion uniquement</option>
                        <option value="private">Privé (Masqué de l'annuaire de compétences)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bouton de sauvegarde */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Enregistrer les modifications
                </button>
              </div>

            </form>

          </div>
        </div>

      </div>

    </div>
  );
}