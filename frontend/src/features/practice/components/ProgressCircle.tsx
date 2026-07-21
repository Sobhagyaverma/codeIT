import { motion } from "framer-motion";

type ProgressCircleProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
};

export default function ProgressCircle({
  value,
  size = 88,
  strokeWidth = 8,
  label,
  className = "",
}: ProgressCircleProps) {
  const progress = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);
  const rounded = Math.round(progress);

  return (
    <div
      aria-label={label ? `${label}: ${rounded}%` : `${rounded}% complete`}
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      role="img"
      style={{ height: size, width: size }}
    >
      <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="var(--bg-inset)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          animate={{ strokeDashoffset: offset }}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          r={radius}
          stroke="var(--accent)"
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-[var(--text)]">
        {rounded}%
      </span>
    </div>
  );
}
