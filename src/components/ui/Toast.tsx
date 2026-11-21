import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const config = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-zinc-200 border-l-4 border-l-emerald-600 dark:border-zinc-800 dark:border-l-emerald-500',
  },
  error: {
    icon: AlertCircle,
    color: 'text-brand-600 dark:text-brand-400',
    border: 'border-zinc-200 border-l-4 border-l-brand-600 dark:border-zinc-800 dark:border-l-brand-500',
  },
  info: {
    icon: Info,
    color: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 border-l-4 border-l-zinc-950 dark:border-zinc-800 dark:border-l-white',
  },
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const { icon: Icon, color, border } = config[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-start gap-3 rounded-lg border ${border} bg-white dark:bg-zinc-950 px-4 py-3 shadow-card-hover min-w-[280px] max-w-sm`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
