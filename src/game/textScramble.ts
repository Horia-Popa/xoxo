const HEX_CHARS = '0123456789ABCDEF._';

/** Generate a single random hex/cyber character */
export const randomHexChar = (): string => {
  return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
};

/**
 * Generate a scrambled string where characters up to `resolvedCount`
 * show their final value and the rest are random hex chars.
 */
export const scrambleText = (
  target: string,
  resolvedCount: number
): string => {
  if (target.length === 0) return '';

  const clamped = Math.max(0, Math.min(resolvedCount, target.length));
  const resolved = target.slice(0, clamped);
  const scrambled = Array.from({ length: target.length - clamped }, () => randomHexChar()).join('');

  return resolved + scrambled;
};

/**
 * Generate the typewriter-revealed portion of text with cursor.
 */
export const typewriterText = (
  target: string,
  revealedCount: number
): string => {
  if (target.length === 0) return '';

  const clamped = Math.max(0, Math.min(revealedCount, target.length));

  if (clamped >= target.length) {
    return target;
  }

  return target.slice(0, clamped) + '▌';
};
