import { useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Scanline, ChromaticAberration } from '@react-three/postprocessing';
import { Vector2 } from 'three';
import type { GamePhase, WinResult, Mark } from '../game/types';
import { MatrixRain } from './MatrixRain';
import { GlitchEffect } from './GlitchEffect';
import { WinLine } from './WinLine';
import { CoinFlip } from './CoinFlip';
import { ScreenShake } from './ScreenShake';

const CHROMATIC_PEAK = 0.008;
const CHROMATIC_DECAY_MS = 300;

interface SceneProps {
  children?: ReactNode;
  gamePhase: GamePhase;
  winResult: WinResult | null;
  playerNames: readonly [string, string];
  onCoinFlipComplete: (startingMark: Mark) => void;
  skinColors?: Partial<Record<Mark, string>>;
  moveCount: number;
}

const SceneLighting = (): ReactNode => (
  <>
    <ambientLight intensity={0.3} color="#ffffff" />
    <pointLight position={[5, 5, 5]} intensity={1.5} color="#00ffff" />
    <pointLight position={[-5, 3, -5]} intensity={1.0} color="#ff00ff" />
    <pointLight position={[0, -4, 3]} intensity={0.6} color="#39ff14" />
  </>
);

const ChromaticDecay = ({ offset, startTimeRef }: {
  offset: Vector2;
  startTimeRef: React.RefObject<number>;
}): null => {
  useFrame(() => {
    if (offset.x === 0 && offset.y === 0) return;
    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / CHROMATIC_DECAY_MS, 1);
    const value = CHROMATIC_PEAK * (1 - progress);
    offset.set(value, value);
  });
  return null;
};

const SceneEffects = ({ chromaticOffset }: { chromaticOffset: Vector2 }): ReactNode => (
  <EffectComposer>
    <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur />
    <Scanline density={1.25} opacity={0.08} />
    <ChromaticAberration
      offset={chromaticOffset}
      radialModulation={false}
      modulationOffset={0}
    />
  </EffectComposer>
);

export const Scene = ({
  children,
  gamePhase,
  winResult,
  playerNames,
  onCoinFlipComplete,
  skinColors,
  moveCount,
}: SceneProps): ReactNode => {
  const glitchActive = gamePhase === 'won' || gamePhase === 'draw';
  const glitchVariant = gamePhase === 'draw' ? 'draw' : 'win';
  const chromaticOffset = useRef(new Vector2(0, 0)).current;
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (moveCount === 0) return;
    chromaticOffset.set(CHROMATIC_PEAK, CHROMATIC_PEAK);
    startTimeRef.current = performance.now();
  }, [moveCount, chromaticOffset]);

  return (
    <Canvas
      camera={{ position: [0, 5, 7], fov: 50 }}
      style={{ background: '#0a0a0f' }}
      gl={{ antialias: true }}
    >
      <SceneLighting />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.1}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={15}
      />
      <MatrixRain />
      <GlitchEffect active={glitchActive} variant={glitchVariant}>
        {children}
      </GlitchEffect>
      {winResult && <WinLine line={winResult.line} />}
      {gamePhase === 'coin-flip' && (
        <CoinFlip
          playerNames={playerNames}
          onComplete={onCoinFlipComplete}
          skinColors={skinColors}
        />
      )}
      <ScreenShake trigger={moveCount} />
      <ChromaticDecay offset={chromaticOffset} startTimeRef={startTimeRef} />
      <SceneEffects chromaticOffset={chromaticOffset} />
    </Canvas>
  );
};
