import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Grid } from '@react-three/drei';
import { useIDEStore } from '../../core/store/themeStore';

const RoboticArmModel: React.FC = () => {
  // Bind directly to structural transform vectors from the Zustand core
  const position = useIDEStore((state) => state.robotTransform.position);
  
  return (
    <RigidBody type="kinematicPosition">
      <mesh position={position}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} />
      </mesh>
    </RigidBody>
  );
};

export const ViewportView: React.FC = () => {
  return (
    <div className="w-full h-full bg-zinc-900 relative">
      <Canvas camera={{ position:, fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <Physics gravity={[0, -9.81, 0]}>
          {/* Target Workspace Actor */}
          <RoboticArmModel />
          
          {/* Working Ground Collision Envelope */}
          <RigidBody type="fixed">
            <CuboidCollider args={[10, 0.1, 10]} position={[0, -0.1, 0]} />
            <Grid args={[20, 20]} sectionColor="#3f3f46" cellColor="#27272a" position={[0, -0.05, 0]} />
          </RigidBody>
        </Physics>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};
