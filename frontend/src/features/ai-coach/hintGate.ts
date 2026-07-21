/**
 * Pure helpers for progressive hint gating — kept free of React for easy testing.
 */
export function canUnlockHintLevel(
  unlockedHintLevel: number,
  requestedLevel: number
): boolean {
  if (requestedLevel < 1 || requestedLevel > 3) return false;
  return requestedLevel <= unlockedHintLevel + 1;
}

export function isCoachToolEnabled(options: {
  requiresCode?: boolean;
  requiresFailed?: boolean;
  requiresAccepted?: boolean;
  requiresEditorialGate?: boolean;
  hasCode: boolean;
  isFailed: boolean;
  isAccepted: boolean;
  editorialUnlocked: boolean;
}): boolean {
  if (options.requiresCode && !options.hasCode) return false;
  if (options.requiresFailed && !options.isFailed) return false;
  if (options.requiresAccepted && !options.isAccepted) return false;
  if (options.requiresEditorialGate && !options.editorialUnlocked) return false;
  return true;
}
