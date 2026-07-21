import { motion } from "framer-motion";

type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export default function ProgressBar({
  value,
  label,
  showValue = false,
  className = "",
}: ProgressBarProps) {
  const progress = Math.min(100, Math.max(0, value));
  const rounded = Math.round(progress);

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
          {label && <span className="text-[var(--text-dim)]">{label}</span>}
          {showValue && (
            <span className="ml-auto font-medium text-[var(--text)]">
              {rounded}%
            </span>
          )}
        </div>
      )}
      <div
        aria-label={label ?? "Progress"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={rounded}
        className="h-2 overflow-hidden rounded-full bg-[var(--bg-inset)]"
        role="progressbar"
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
