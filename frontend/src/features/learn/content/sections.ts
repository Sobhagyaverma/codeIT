import type { LessonSection } from "../types";
import { CONTROL_FLOW_SECTION } from "./controlFlow";
import { OPERATORS_SECTION } from "./operators";
import { PATTERN_BASICS_SECTION } from "./patternBasics";
import { PROVING_GROUNDS_SECTION } from "./provingGrounds";
import { START_HERE_SECTION } from "./startHere";

/**
 * Registry of learn sections. Add new sections here and to LEARN_SECTION_ORDER
 * only when they should appear as stacked LearnSectionCards on /dsa-sheet.
 * Pattern Basics is registered for routes/progress but shown inside Pattern Problems.
 * Proving Grounds is registered for lesson/progress helpers but rendered as a
 * PRACTICE_ROADMAP ModuleAccordion (Foundations-style), not a LearnSectionCard.
 */
export const LEARN_SECTIONS: Record<string, LessonSection> = {
  [START_HERE_SECTION.id]: START_HERE_SECTION,
  [CONTROL_FLOW_SECTION.id]: CONTROL_FLOW_SECTION,
  [OPERATORS_SECTION.id]: OPERATORS_SECTION,
  [PATTERN_BASICS_SECTION.id]: PATTERN_BASICS_SECTION,
  [PROVING_GROUNDS_SECTION.id]: PROVING_GROUNDS_SECTION,
};

/** Explicit sheet order for stacked LearnSectionCards on /dsa-sheet. */
export const LEARN_SECTION_ORDER = [
  "start-here",
  "control-flow",
  "operators",
] as const;

export function getLearnSection(sectionId: string): LessonSection | undefined {
  return LEARN_SECTIONS[sectionId];
}

export function getLesson(sectionId: string, slug: string) {
  return getLearnSection(sectionId)?.lessons.find((l) => l.slug === slug);
}

export function getLessonByOrder(sectionId: string, order: number) {
  return getLearnSection(sectionId)?.lessons.find((l) => l.order === order);
}

/** Next learn section in LEARN_SECTION_ORDER, if any. */
export function getNextLearnSection(
  sectionId: string
): LessonSection | undefined {
  const idx = LEARN_SECTION_ORDER.indexOf(
    sectionId as (typeof LEARN_SECTION_ORDER)[number]
  );
  if (idx < 0 || idx >= LEARN_SECTION_ORDER.length - 1) return undefined;
  return getLearnSection(LEARN_SECTION_ORDER[idx + 1]);
}

/** First lesson of a section (lowest order). */
export function getFirstLesson(sectionId: string) {
  const lessons = getLearnSection(sectionId)?.lessons;
  if (!lessons?.length) return undefined;
  return [...lessons].sort((a, b) => a.order - b.order)[0];
}

/**
 * Topic titles used to exclude learn problems from roadmap bucketing.
 * Proving Grounds is intentionally omitted — it owns a PRACTICE_ROADMAP module.
 */
export function learnSectionTopicTitles(): string[] {
  return Object.values(LEARN_SECTIONS)
    .filter((s) => s.id !== "proving-grounds")
    .map((s) => s.title);
}

/**
 * Extra topic tags that live outside the DSA roadmap (Pattern Problems tiers,
 * plus Pattern Basics before/alongside learn-section registration).
 */
export const EXTRA_ROADMAP_EXCLUDED_TOPICS = [
  "Pattern Basics",
  "Pattern Problems",
] as const;

/** All topics that must never land in Foundations or Other. */
export function roadmapExcludedTopics(): string[] {
  return [
    ...learnSectionTopicTitles(),
    ...EXTRA_ROADMAP_EXCLUDED_TOPICS,
  ];
}

export function isRoadmapExcludedTopic(topic: string): boolean {
  return roadmapExcludedTopics().includes(topic);
}

/** Find which learn section (if any) owns a problem by exact topic title match. */
export function findLearnSectionByTopics(
  topics: string[]
): LessonSection | undefined {
  const set = new Set(topics);
  return Object.values(LEARN_SECTIONS).find((s) => set.has(s.title));
}
