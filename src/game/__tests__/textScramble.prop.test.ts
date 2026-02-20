import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scrambleText, typewriterText } from '../textScramble';

const HEX_CHARS_SET = new Set('0123456789ABCDEF._'.split(''));

describe('textScramble property tests', () => {
  // Feature: feedback-and-terminal-ui, Property 1: Scramble resolved prefix matches target
  it('Property 1: Scramble resolved prefix matches target', () => {
    // **Validates: Requirements 4.1, 4.2**
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.nat(),
        (target, rawCount) => {
          const resolvedCount = target.length === 0 ? 0 : rawCount % (target.length + 1);
          const result = scrambleText(target, resolvedCount);

          if (target.length === 0) {
            expect(result).toBe('');
            return;
          }

          expect(result.length).toBe(target.length);
          const prefix = result.slice(0, resolvedCount);
          expect(prefix).toBe(target.slice(0, resolvedCount));
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: feedback-and-terminal-ui, Property 2: Scramble unresolved suffix uses only hex characters
  it('Property 2: Scramble unresolved suffix uses only hex characters', () => {
    // **Validates: Requirements 4.4**
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.nat(),
        (target, rawCount) => {
          const resolvedCount = rawCount % target.length; // 0 to length-1, ensuring unresolved suffix exists
          const result = scrambleText(target, resolvedCount);

          expect(result.length).toBe(target.length);

          const suffix = result.slice(resolvedCount);
          for (const char of suffix) {
            expect(HEX_CHARS_SET.has(char)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: feedback-and-terminal-ui, Property 3: Typewriter reveal shows correct prefix with cursor behavior
  it('Property 3: Typewriter reveal shows correct prefix with cursor behavior', () => {
    // **Validates: Requirements 3.1, 3.2**
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.nat(),
        (target, rawCount) => {
          const revealedCount = rawCount % (target.length + 1);
          const result = typewriterText(target, revealedCount);

          if (revealedCount < target.length) {
            // Should be prefix + cursor
            expect(result).toBe(target.slice(0, revealedCount) + '▌');
          } else {
            // revealedCount === target.length — full text, no cursor
            expect(result).toBe(target);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
