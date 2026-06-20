import React from 'react';
import { Box } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Sample robot arm geometry
const RobotArm: React.FC = () => {
  const groupRef = React.useRef<THREE.Group>(null);

  React.useEffect(() => {
    // Simple robot arm animation
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.z += 0.01;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <group ref={groupRef}>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
        <meshPhongMaterial color="#4a90e2" />
      </mesh>

      {/* Joint 1 */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhongMaterial color="#e24a4a" />
      </mesh>

      {/* Link 1 */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshPhongMaterial color="#4ae290" />
      </mesh>

      {/* Joint 2 */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhongMaterial color="#e24a4a" />
      </mesh>

      {/* Link 2 */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.08, 1, 0.08]} />
        <meshPhongMaterial color="#4ae290" />
      </mesh>

      {/* End Effector */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshPhongMaterial color="#e2d04a" />
      </mesh>
    </group>
  );
};

export const View3D: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <primitive object={new THREE.GridHelper(10, 10)} />
        <RobotArm />
      </Canvas>
    </Box>
  );
};
