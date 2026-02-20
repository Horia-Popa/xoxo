import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface GlitchEffectProps {
  active: boolean;
  intensity?: number;
  variant?: 'win' | 'draw';
  children?: ReactNode;
}

export const GlitchEffect = ({
  active,
  intensity = 0.5,
  variant = 'win',
  children,
}: GlitchEffectProps): ReactNode => {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!active) {
      group.position.set(0, 0, 0);
      return;
    }

    if (variant === 'win') {
      const strength = intensity * 0.15;
      group.position.set(
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
      );
    } else {
      const strength = intensity * 0.05;
      group.position.set(
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
};
