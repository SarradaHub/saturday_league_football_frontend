export * from '../foundations/colors';
export * from '../foundations/typography';
export * from '../foundations/spacing';
export * from '../foundations/shadows';
export * from '../foundations/borderRadius';
export * from '../foundations/breakpoints';

import { colors } from '../foundations/colors';
import { typography } from '../foundations/typography';
import { spacing, spacingSemantic } from '../foundations/spacing';
import { shadows } from '../foundations/shadows';
import { borderRadius } from '../foundations/borderRadius';
import { breakpoints, breakpointValues } from '../foundations/breakpoints';

export const tokens = {
  colors,
  typography,
  spacing,
  spacingSemantic,
  shadows,
  borderRadius,
  breakpoints,
  breakpointValues,
} as const;

