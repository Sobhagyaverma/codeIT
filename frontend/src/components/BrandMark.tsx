type BrandMarkProps = {
  className?: string;
  /** Accessible label; defaults to CodeT. */
  label?: string;
};

/** Wordmark: “Code” + cursive slanted lowercase “t”. */
export default function BrandMark({
  className = "",
  label = "CodeT",
}: BrandMarkProps) {
  return (
    <span
      className={`brand-mark ${className}`.trim()}
      data-brand-mark
      aria-label={label}
    >
      Code
      <span className="brand-mark-t" data-brand-mark-t aria-hidden="true">
        t
      </span>
    </span>
  );
}
