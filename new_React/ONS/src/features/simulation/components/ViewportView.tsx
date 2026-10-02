import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Grid } from '@react-three/drei';
import { useThemeStore } from '@/core/store/themeStore';

const RoboticArmModel: React.FC<{ color: string }> = ({ color }) => {
  const position: [number, number, number] = [0, 1, 0];
  
  return (
    <RigidBody type="kinematicPosition">
      <mesh position={position}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
    </RigidBody>
  );
};

export const ViewportView: React.FC = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--ide-surface-bg').trim();
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

  return (
    <div className="w-full h-full bg-ide-surface relative" data-theme={currentTheme}>
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <color attach="background" args={[surfaceColor]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <Physics gravity={[0, -9.81, 0]}>
          {/* Target Workspace Actor */}
          <RoboticArmModel color={primaryColor} />
          
          {/* Working Ground Collision Envelope */}
          <RigidBody type="fixed">
            <CuboidCollider args={[10, 0.1, 10]} position={[0, -0.1, 0]} />
            <Grid args={[20, 20]} sectionColor={primaryColor} cellColor={borderColor} position={[0, -0.05, 0]} />
          </RigidBody>
        </Physics>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};
