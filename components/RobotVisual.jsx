'use client';

import * as THREE from 'three';
import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Plane } from '@react-three/drei';
import  URDFLoader  from 'urdf-loader'; // Direct import
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';


const RobotVisual = () => {
  const [robotUrl, setRobotUrl] = useState(null);
  const [robot, setRobot] = useState(null);
  


  useEffect(() => {
    setRobotUrl('/api/urdfData')
    if (robotUrl) {
      const loader = new URDFLoader();
      loader.loadMeshCb = (path, manager, done) => {
        if (path.endsWith('.dae')) {
          new ColladaLoader(manager).load(
            path,
            (collada) => {
              const object = collada.scene;
              done(object);
              //console.log(object);
            },
            null,
            (err) => {
              console.error(`Error loading DAE file from ${path}:`, err);
              done(null, err);
            }
          );
        } else {
          console.error(`Unsupported file type for path: ${path}`);
          done(null, new Error(`Unsupported file type for path: ${path}`));
        }
      };
      loader.load(robotUrl, (robot) => {
        setRobot(robot)
        //console.log(robot);
      });
    }
  }, [robotUrl]);


  return (
    <Canvas shadows={{ type: "PCFSoftShadowMap" }} camera={{ position: [-1.7, 1, 1.0], fov: 40 }}>
      <directionalLight
        castShadow
        intensity={1}
        color={0xffffff}
        position={[5, 30, 5]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.8} color={0xffffff} />
      <gridHelper args={[10, 10]} />
      <axesHelper />
      <Suspense fallback={null}>
        <OrbitControls enableZoom={true} />
        <group>
        <mesh
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        rotation={[-0.5 * Math.PI, 0, Math.PI]}
        scale={1}
      >
          {robot && <primitive object={robot} />}
          </mesh>
          <Plane receiveShadow rotation={[-Math.PI / 2, 0, 0]} args={[1000, 1000]} scale={30}>
            <shadowMaterial opacity={0.25} />
          </Plane>
        </group>
      </Suspense>
    </Canvas>
    
  );
};

export default RobotVisual;
