import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  ShieldAlert, 
  Heart, 
  Share2, 
  Check,
  Copy,
  Clock,
  Send,
  FileCheck,
  QrCode as QrIcon,
  User,
  GraduationCap,
  Upload,
  CheckCircle
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export interface StudentCardDetails {
  status: 'not_requested' | 'pending' | 'approved';
  matricule?: string;
  filiere?: string;
  niveau?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  residenceCity?: string;
}

export function StudentCardPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);

  const [cardData, setCardData] = useState<StudentCardDetails>({
    status: 'not_requested',
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'academic' | 'emergency' | 'identity'>('academic');

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    matricule: '',
    filiere: '',
    niveau: '',
    bloodGroup: 'O+',
    residenceCity: '',
    emergencyName: '',
    emergencyRelation: 'Parent / Tuteur',
    emergencyPhone: '',
    photoUrl: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photoUrl: localUrl }));
      addToast('success', 'Photo chargée avec succès !');
    }
  };

  const handleSubmitDemand = () => {
    if (!formData.fullName || !formData.matricule || !formData.filiere || !formData.niveau || !formData.emergencyPhone) {
      addToast('error', 'Veuillez remplir les champs obligatoires.');
      return;
    }

    setCardData({
      status: 'pending',
      matricule: formData.matricule,
      filiere: formData.filiere,
      niveau: formData.niveau,
      bloodGroup: formData.bloodGroup,
      residenceCity: formData.residenceCity,
      emergencyContactName: formData.emergencyName,
      emergencyContactRelation: formData.emergencyRelation,
      emergencyContactPhone: formData.emergencyPhone,
    });

    addToast('info', 'Demande enregistrée. En attente de validation par l\'administration.');
  };

  const handleSimulateAdminApproval = () => {
    setCardData(prev => ({ ...prev, status: 'approved' }));
    addToast('success', 'Carte approuvée par la scolarité ! Votre badge est désormais actif.');
  };

  const handleCopyId = () => {
    if (!cardData.matricule) return;
    navigator.clipboard.writeText(cardData.matricule);
    setCopied(true);
    addToast('info', 'Matricule copié.');
    setTimeout(() => setCopied(false), 2000);
  };

  const qrPayload = JSON.stringify({
    uid: user?.id || 'std-123',
    mat: cardData.matricule || 'N/A',
    name: formData.fullName,
    st: cardData.status,
  });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8">
      {/* En-tête */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Carte d'Étudiant Numérique
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Badge d'accès universel et profil de sécurité
          </p>
        </div>
        {cardData.status === 'approved' && (
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Fiche Urgence</span>
          </button>
        )}
      </div>

      {/* 1. FORMULAIRE D'IMMATRICULATION */}
      {cardData.status === 'not_requested' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-6 shadow-xl border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Formulaire d'Immatriculation
                </h2>
                <p className="text-xs text-slate-500">
                  Remplissez vos informations académiques et sanitaires pour générer votre badge.
                </p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'academic' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Académique
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emergency')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'emergency' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Heart className="h-3.5 w-3.5" /> Urgence / Santé
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'identity' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Photo / Pièce
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'academic' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Ex: Fanon Ngoga"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Matricule Officiel *</label>
                    <input
                      type="text"
                      placeholder="Ex: 26IAI1234"
                      value={formData.matricule}
                      onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Filière / Spécialité *</label>
                    <input
                      type="text"
                      placeholder="Ex: Systèmes & Réseaux"
                      value={formData.filiere}
                      onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Niveau Académique *</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Niveau 1 (L1)">Niveau 1 (L1)</option>
                      <option value="Niveau 2 (L2)">Niveau 2 (L2)</option>
                      <option value="Niveau 3 (L3)">Niveau 3 (L3)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('emergency')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold cursor-pointer"
                  >
                    Suivant : Urgence & Santé
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'emergency' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Groupe Sanguin</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    >
                      <option value="A+">A+</option>
                      <option value="O+">O+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ville de Résidence</label>
                    <input
                      type="text"
                      placeholder="Ex: Douala"
                      value={formData.residenceCity}
                      onChange={(e) => setFormData({ ...formData, residenceCity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du Contact d'Urgence</label>
                    <input
                      type="text"
                      placeholder="Nom du parent / tuteur"
                      value={formData.emergencyName}
                      onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone d'Urgence *</label>
                    <input
                      type="tel"
                      placeholder="+237 6..."
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('academic')}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('identity')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold cursor-pointer"
                  >
                    Suivant : Photo d'Identité
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'identity' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-xs">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Aperçu" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.photoUrl ? "Photo chargée avec succès !" : "Télécharger une photo de profil officielle"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fond neutre (Format PNG/JPG, Max 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="photo-upload-input" 
                    onChange={handlePhotoChange}
                  />
                  <label htmlFor="photo-upload-input" className="inline-block px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 transition-colors">
                    {formData.photoUrl ? "Changer de photo" : "Choisir un fichier"}
                  </label>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('emergency')}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitDemand}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Soumettre la demande
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      )}

      {/* 2. DEMANDE EN ATTENTE */}
      {cardData.status === 'pending' && (
        <Card className="p-8 max-w-xl mx-auto text-center space-y-5 border-amber-200/60 dark:border-amber-900/30">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-pulse">
            <Clock className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Dossier soumis à la Scolarité
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Votre dossier d'immatriculation est en cours de traitement.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200/60 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Nom :</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Matricule :</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{cardData.matricule}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Filière :</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{cardData.filiere} ({cardData.niveau})</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 mb-3">Mode Test : Simuler la validation administrative par la scolarité</p>
            <button
              onClick={handleSimulateAdminApproval}
              className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle className="h-4 w-4" /> Approuver la carte (Simulation Admin)
            </button>
          </div>
        </Card>
      )}

      {/* 3. CARTE ACTIVE RECTO-VERSO */}
      {cardData.status === 'approved' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-2">
            <div 
              className="w-full max-w-[400px] h-[250px] cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* RECTO */}
                {!isFlipped && (
                  <div className="absolute inset-0 w-full h-full rounded-2xl p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center gap-2">
                        {/* Vrai logo IAI harmonisé avec la même taille */}
                        <img 
                          src="/iai.png" 
                          alt="Logo IAI" 
                          className="h-8 w-8 object-contain" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                        />
                        <div>
                          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-200">EduCampus</p>
                          <p className="text-[8px] text-indigo-300 uppercase tracking-wider">Carte d'Étudiant</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold tracking-wider">
                        VALIDE
                      </span>
                    </div>

                    <div className="flex items-center gap-4 z-10 my-auto">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Profil" className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border-2 border-indigo-400/30 shadow-lg" />
                      ) : (
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-indigo-900/60 border-2 border-indigo-400/30 flex items-center justify-center text-xl font-bold text-indigo-200 shadow-lg">
                          {formData.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-white truncate">
                          {formData.fullName}
                        </h3>
                        <p className="text-xs text-indigo-200 truncate">{cardData.filiere}</p>
                        <p className="text-[10px] text-slate-400">{cardData.niveau}</p>
                        <p className="text-xs font-mono font-bold text-indigo-400 pt-1">{cardData.matricule}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end z-10 border-t border-white/10 pt-2 text-[10px] text-slate-400">
                      <span>EXP: 08/2027</span>
                      <span className="flex items-center gap-1 text-indigo-300">
                        <RotateCw className="h-3 w-3" /> Cliquer pour retourner
                      </span>
                    </div>
                  </div>
                )}

                {/* VERSO AVEC QR CODE ET LES 2 INFOS (GROUPE SANGUIN & CONTACT URGENCE) */}
                {isFlipped && (
                  <div 
                    className="absolute inset-0 w-full h-full rounded-2xl p-5 bg-slate-950 text-white shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-white rounded-lg">
                          <img src={qrCodeUrl} alt="QR Code" className="h-10 w-10" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Badge Sécurisé QR</p>
                          <p className="text-[9px] text-slate-400">Accès examens & bibliothèque</p>
                        </div>
                      </div>
                      <QrIcon className="h-5 w-5 text-indigo-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] my-auto">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[8px] text-slate-400 uppercase font-semibold">Groupe Sanguin</p>
                        <p className="font-bold text-rose-400 text-sm mt-0.5">{cardData.bloodGroup}</p>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[8px] text-slate-400 uppercase font-semibold">Contact Urgence</p>
                        <p className="font-mono font-bold text-slate-200 text-xs mt-0.5 truncate">{cardData.emergencyContactPhone}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-2 text-[9px] text-slate-400">
                      <span>IAI-Cameroon Official</span>
                      <span className="flex items-center gap-1 text-indigo-300">
                        <RotateCw className="h-3 w-3" /> Voir Recto
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 max-w-xl mx-auto">
            <Card interactive onClick={handleCopyId} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Copy className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-[10px] text-slate-500">Matricule</p>
                  <p className="font-mono text-xs font-bold">{cardData.matricule}</p>
                </div>
              </div>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4 text-slate-400" />}
            </Card>

            <Card interactive onClick={() => setShowSosModal(true)} className="flex items-center justify-between p-3 border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <div>
                  <p className="text-[10px] text-slate-500">Contact Urgence</p>
                  <p className="text-xs font-bold text-rose-600">{cardData.emergencyContactPhone}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal Urgence */}
      <Modal open={showSosModal} onClose={() => setShowSosModal(false)} title="Assistance Urgence Campus">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1">
            <p className="font-bold">Contact Tuteur / Parent enregistré :</p>
            <p className="font-mono">{cardData.emergencyContactName} ({cardData.emergencyContactRelation}) : {cardData.emergencyContactPhone}</p>
          </div>
          <div className="pt-2 flex gap-2">
            <button onClick={() => setShowSosModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 font-semibold cursor-pointer flex-1">
              Fermer
            </button>
            <a href={`tel:${cardData.emergencyContactPhone}`} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-center flex-1">
              Appeler le tuteur
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}