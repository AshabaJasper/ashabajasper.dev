/**
 * Names of the JSX components a post may use. Pure, so the content check
 * (scripts/check-content.ts) can read it without React. tests/blog-figures.test.ts
 * keeps it equal to the component map in mdx-components.tsx.
 */
export const MDX_COMPONENT_NAMES = [
  "Note",
  "Callout",
  "Diagram",
  "Node",
  "Steps",
  "Timeline",
  "Step",
  "Stats",
  "Stat",
  "Compare",
  "CompareSide",
  "Cards",
  "Card",
  "BookingTimeline",
  "RaceSequence",
  "CnnLayers",
] as const;
