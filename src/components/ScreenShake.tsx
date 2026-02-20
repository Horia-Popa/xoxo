import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

interface ShakeState {
  active: boolean;
  startTime: number;
  originalPosition: { x: number; y: number; z: number };
}

interface ScreenShakeProps {
  trigger: number;
  intensity?: number;
  duration?: number;
}

export const ScreenShake = ({
  trigger,
  intensity = 0.15,
  duration = 200,
}: ScreenShakeProps): null => {
  const { camera } = useThree();
  const shakeRef = useRef<ShakeState>({
    active: false,
    startTime: 0,
    originalPosition: { x: 0, y: 0, z: 0 },
  });
  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === prevTriggerRef.current) return;
    prevTriggerRef.current = trigger;

    if (!camera) return;
    if (intensity <= 0 || duration <= 0) return;

    shakeRef.current = {
      active: true,
      startTime: performance.now(),
      originalPosition: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
    };
  }, [trigger, camera, intensity, duration]);

  useFrame(() => {
    const state = shakeRef.current;
    if (!state.active || !camera) return;

    const elapsed = performance.now() - state.startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      camera.position.x = state.originalPosition.x;
      camera.position.y = state.originalPosition.y;
      state.active = false;
      return;
    }

    const decay = 1 - progress;
    const offsetX = (Math.random() * 2 - 1) * intensity * decay;
    const offsetY = (Math.random() * 2 - 1) * intensity * decay;

    camera.position.x = state.originalPosition.x + offsetX;
    camera.position.y = state.originalPosition.y + offsetY;
  });

  return null;
};
