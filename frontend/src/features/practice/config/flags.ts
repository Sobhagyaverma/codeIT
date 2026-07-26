/**
 * Practice catalog UI flags. Flip these when backend metrics ship.
 */
export const PRACTICE_FLAGS = {
  /** Acceptance rate column / Acc chip — needs catalog API metrics */
  showAcceptanceColumn: false,
  /** Most-solved sort / solved count chips — needs catalog API metrics */
  showSolvedCountMetrics: false,
} as const;
