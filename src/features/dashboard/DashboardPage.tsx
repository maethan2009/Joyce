import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Vote, IdCard, Sparkles, Users, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';

const modules = [
  { to: '/elections', label: 'Elections', desc: 'View and vote in campus elections', icon: Vote, color: 'bg-brand-500' },
  { to: '/student-card', label: 'Student Card', desc: 'Your digital ID with rotating QR', icon: IdCard, color: 'bg-accent-500' },
  { to: '/hub', label: 'Academic Hub', desc: 'Course materials, exams, and summaries', icon: BookOpen, color: 'bg-success-500' },
  { to: '/skilllink', label: 'SkillLink', desc: 'Offer and find peer skills', icon: Sparkles, color: 'bg-info-500' },
  { to: '/mentorship', label: 'Mentorship', desc: 'Find a mentor or become one', icon: Users, color: 'bg-danger-500' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const isMockMode = useAppStore((s) => s.isMockMode);

  // Exemple d'états réels (à remplacer/lier avec ton store ou tes appels API/Supabase)
  const stats = {
    electionsCount: isMockMode ? 3 : 0,
    resourcesCount: isMockMode ? 20 : 0,
    skillsCount: isMockMode ? 10 : 0,
    mentorsCount: isMockMode ? 5 : 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
          Welcome, {profile?.full_name?.split(' ')[0] ?? 'Student'}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {isMockMode ? 'You are in demo mode — explore all features with mock data.' : 'Here is your campus overview.'}
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <motion.div key={m.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card 
              interactive 
              onClick={() => navigate(m.to)} 
              className="h-full cursor-pointer"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${m.color} text-white`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">{m.label}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
        <Card className="bg-gradient-to-br from-brand-50 to-slate-50 dark:from-brand-900/20 dark:to-slate-800/50">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-brand-600" />
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">Quick Stats</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your campus activity at a glance</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
              <p className="text-2xl font-bold text-brand-600">{stats.electionsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active elections</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
              <p className="text-2xl font-bold text-success-600">{stats.resourcesCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Resources available</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
              <p className="text-2xl font-bold text-info-600">{stats.skillsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Skill offers</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4">
              <p className="text-2xl font-bold text-accent-600">{stats.mentorsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Potential mentors</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}