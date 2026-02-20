import { describe, it, expect } from 'vitest';
import { scrambleText, typewriterText, randomHexChar } from '../textScramble';

const HEX_CHARS_SET = new Set('0123456789ABCDEF._'.split(''));

describe('scrambleText', () => {
  it('returns empty string for empty target', () => {
    expect(scrambleText('', 0)).toBe('');
  });

  it('returns target exactly when resolvedCount equals target length', () => {
    const target = 'HELLO';
    expect(scrambleText(target, target.length)).toBe(target);
  });
});

describe('typewriterText', () => {
  it('returns just cursor when revealedCount is 0', () => {
    expect(typewriterText('HELLO', 0)).toBe('▌');
  });

  it('returns empty string for empty target', () => {
    expect(typewriterText('', 0)).toBe('');
  });
});

describe('randomHexChar', () => {
  it('returns a single character from the allowed set', () => {
    const char = randomHexChar();
    expect(char.length).toBe(1);
    expect(HEX_CHARS_SET.has(char)).toBe(true);
  });
});
