import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion settings: short distances, short durations, ease-out.
 * Springs are only for things the user opened, like dialogs.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const transitions = {
  /** Default for fades and small travel. */
  base: { duration: 0.28, ease: EASE_OUT },
  /** Quick feedback: hovers, taps, colour changes. */
  fast: { duration: 0.16, ease: EASE_OUT },
  /** Dialogs and anything that should feel physical. */
  spring: { type: "spring", stiffness: 320, damping: 30, mass: 0.8 },
  /** The sliding indicator behind active tabs and nav items. */
  indicator: { type: "spring", stiffness: 380, damping: 32 },
} satisfies Record<string, Transition>;

/** Page shell: content lifts in as the route settles. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.base, staggerChildren: 0.05 },
  },
};

/** Wrap a group; children animate in one after another. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** A card, stat tile or list entry inside a stagger container. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

/** Table rows: a shorter rise, so long tables do not feel wavy. */
export const rowItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, transition: transitions.fast },
};

export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.spring },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

/** Panels that expand in place, such as a filter drawer. */
export const collapseVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: transitions.base },
  exit: { opacity: 0, height: 0, transition: transitions.fast },
};
