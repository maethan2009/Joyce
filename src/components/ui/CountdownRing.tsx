import { motion } from 'framer-motion';

interface CountdownRingProps {
  secondsTotal: number;
  secondsRemaining: number;
  size?: number;
}

export function CountdownRing({ secondsTotal, secondsRemaining, size = 64 }: CountdownRingProps) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsRemaining / secondsTotal;
  const dashOffset = circumference * (1 - progress);
  const color = secondsRemaining <= 5 ? '#ef4444' : secondsRemaining <= 10 ? '#f59e0b' : '#4f46e5';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-800" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{secondsRemaining}</span>
    </div>
  );
}
