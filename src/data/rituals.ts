import type { Ritual } from "../types";

export type RitualDefinition = {
  id: Ritual;
  number: string;
  name: string;
  verb: string;
  description: string;
  result: string;
  glyph: string;
};

export const RITUALS: RitualDefinition[] = [
  {
    id: "burn",
    number: "01",
    name: "Incinerate",
    verb: "burn it",
    description: "Slow. Final. Reduced to heat, sparks, and nothing.",
    result: "Ash has no memory.",
    glyph: "△",
  },
  {
    id: "shatter",
    number: "02",
    name: "Shatter",
    verb: "break it",
    description: "One clean impact. Let every piece find its own direction.",
    result: "It cannot hold its shape anymore.",
    glyph: "◇",
  },
  {
    id: "shred",
    number: "03",
    name: "Shred",
    verb: "tear it",
    description: "Methodical destruction, strip by satisfying strip.",
    result: "There is nothing left to reread.",
    glyph: "╱",
  },
  {
    id: "dissolve",
    number: "04",
    name: "Dissolve",
    verb: "erase it",
    description: "Quietly release it into the dark until it was never there.",
    result: "The weight has left the room.",
    glyph: "○",
  },
];

export const getRitual = (id: Ritual) =>
  RITUALS.find((ritual) => ritual.id === id) ?? RITUALS[0];
