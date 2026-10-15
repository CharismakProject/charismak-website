// Kept separate from the 3D code so pages can check for a model without loading three.js.
export const RATE_3D_SLUGS = [
  "230mm-hollow-sandcrete-blockwork",
  "150mm-hollow-sandcrete-blockwork",
  "plywood-formwork-columns",
] as const;

export const hasRate3D = (slug: string) => (RATE_3D_SLUGS as readonly string[]).includes(slug);
