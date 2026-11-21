import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const config = {
  success: { icon: CheckCircle2, color: 'text-success-500', border: 'border-success-200 dark:border-success-800' },
  error: { icon: AlertCircle, color: 'text-danger-500', border: 'border-danger-200 dark:border-danger-800' },
  info: { icon: Info, color: 'text-info-500', border: 'border-info-200 dark:border-info-800' },
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
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`flex items-start gap-3 rounded-xl border ${border} bg-white dark:bg-slate-900 px-4 py-3 shadow-card-hover min-w-[280px] max-w-sm`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
