import assert from "node:assert/strict";

function canUnlockHintLevel(unlockedHintLevel, requestedLevel) {
  if (requestedLevel < 1 || requestedLevel > 3) return false;
  return requestedLevel <= unlockedHintLevel + 1;
}

function isCoachToolEnabled(options) {
  if (options.requiresCode && !options.hasCode) return false;
  if (options.requiresFailed && !options.isFailed) return false;
  if (options.requiresAccepted && !options.isAccepted) return false;
  if (options.requiresEditorialGate && !options.editorialUnlocked) return false;
  return true;
}

assert.equal(canUnlockHintLevel(0, 1), true);
assert.equal(canUnlockHintLevel(0, 2), false);
assert.equal(canUnlockHintLevel(1, 2), true);
assert.equal(canUnlockHintLevel(3, 3), true);

assert.equal(
  isCoachToolEnabled({
    requiresCode: true,
    hasCode: false,
    isFailed: false,
    isAccepted: false,
    editorialUnlocked: false,
  }),
  false
);

assert.equal(
  isCoachToolEnabled({
    requiresFailed: true,
    hasCode: true,
    isFailed: true,
    isAccepted: false,
    editorialUnlocked: false,
  }),
  true
);

assert.equal(
  isCoachToolEnabled({
    requiresEditorialGate: true,
    hasCode: true,
    isFailed: false,
    isAccepted: false,
    editorialUnlocked: false,
  }),
  false
);

console.log("ai-coach hint gate checks passed");
