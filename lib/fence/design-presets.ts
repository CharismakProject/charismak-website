import type { BlockSpecification } from "./types";

/**
 * Standard sandcrete block specifications used by the estimator.
 *
 * Both blocks have the same visible face dimensions, so they
 * use the same estimating factor of 10 blocks per square metre.
 */
export const BLOCK_SPECIFICATIONS = {
  block150mm: {
    lengthMm: 450,
    heightMm: 225,
    thicknessMm: 150,
    blocksPerSquareMetre: 10,
  },

  block225mm: {
    lengthMm: 450,
    heightMm: 225,
    thicknessMm: 225,
    blocksPerSquareMetre: 10,
  },
} satisfies Record<string, BlockSpecification>;

/**
 * The 225 mm block is the initial default for perimeter fencing.
 * Users will still be able to select the 150 mm option where appropriate.
 */
export const DEFAULT_BLOCK_SPECIFICATION =
  BLOCK_SPECIFICATIONS.block225mm;