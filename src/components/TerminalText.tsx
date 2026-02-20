import { useState, useEffect, useRef, useCallback } from 'react';
import { scrambleText, typewriterText } from '../game/textScramble';

interface TerminalTextProps {
  text: string;
  scrambleDuration?: number;
  typewriterSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SCRAMBLE_INTERVAL = 30;

export const TerminalText = ({
  text, scrambleDuration = 400, typewriterSpeed = 50, className, style,
}: TerminalTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();

    if (!text) { setDisplayText(''); return; }
    if (scrambleDuration <= 0 && typewriterSpeed <= 0) { setDisplayText(text); return; }

    const startTypewriter = (target: string) => {
      let revealed = 0;
      setDisplayText(typewriterText(target, revealed));
      intervalRef.current = setInterval(() => {
        revealed += 1;
        setDisplayText(typewriterText(target, revealed));
        if (revealed >= target.length) clearTimer();
      }, typewriterSpeed);
    };

    if (scrambleDuration <= 0) { startTypewriter(text); return clearTimer; }

    const startTime = Date.now();
    setDisplayText(scrambleText(text, 0));

    intervalRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - startTime) / scrambleDuration, 1);
      const resolved = Math.floor(progress * text.length);
      setDisplayText(scrambleText(text, resolved));

      if (progress >= 1) {
        clearTimer();
        if (typewriterSpeed <= 0) { setDisplayText(text); return; }
        startTypewriter(text);
      }
    }, SCRAMBLE_INTERVAL);

    return clearTimer;
  }, [text, scrambleDuration, typewriterSpeed, clearTimer]);

  if (!text) return null;

  return (
    <span className={className} style={style}>
      {displayText}
    </span>
  );
};
