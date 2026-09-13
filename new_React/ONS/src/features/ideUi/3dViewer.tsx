
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Text, Line } from "@react-three/drei"
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier"
import { useThemeStore } from "@/core/store/themeStore"
import { useEffect, useRef, useState } from "react"
import * as LucideIcons from "lucide-react"
import { IdeBarItem } from "./ideBarItem"
import { Slider } from "@/components/ui/slider"
import { Box3, Group, Mesh, Vector3 } from "three"
import URDFLoader from "urdf-loader"
import { useRobotSimulationStore } from "@/core/store/robotSimulationStore"

const getIdeColor = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

const urdfJointNames = [
  "shoulder_pan_joint",
  "shoulder_lift_joint",
  "elbow_joint",
  "wrist_1_joint",
  "wrist_2_joint",
  "wrist_3_joint",
]

const gridMeasurements = [-1, -0.5, 0.5, 1]

const MeasurementGrid = ({ borderColor, primaryColor }: { borderColor: string; primaryColor: string }) => (
  <>
    <Grid
      renderOrder={-1}
      position={[0, 0, 0.002]}
      rotation={[Math.PI / 2, 0, 0]}
      args={[4, 4]}
      cellSize={0.1}
      cellThickness={0.5}
      cellColor={borderColor}
      sectionSize={0.5}
      sectionThickness={1}
      sectionColor={primaryColor}
      fadeDistance={20}
      infiniteGrid={false}
    />
    <Line points={[[-2, 0, 0.004], [2, 0, 0.004]]} color={primaryColor} lineWidth={1.5} />
    <Line points={[[0, -2, 0.004], [0, 2, 0.004]]} color={primaryColor} lineWidth={1.5} />
    {gridMeasurements.map((meters) => (
      <Text
        key={`x-${meters}`}
        position={[meters, 0.035, 0.008]}
        fontSize={0.045}
        color={borderColor}
        anchorX="center"
        anchorY="middle"
      >
        {`${meters * 1000} mm`}
      </Text>
    ))}
    {gridMeasurements.map((meters) => (
      <Text
        key={`y-${meters}`}
        position={[0.045, meters, 0.008]}
        fontSize={0.045}
        color={borderColor}
        anchorX="center"
        anchorY="middle"
      >
        {`${meters * 1000} mm`}
      </Text>
    ))}
    <Text position={[0.1, 0.1, 0.008]} fontSize={0.055} color={primaryColor} anchorX="center" anchorY="middle">
      0 mm
    </Text>
  </>
)

const OriginIndicator = () => (
  <>
    <axesHelper args={[0.35]} />
    <mesh position={[0, 0.008, 0]}>
      <sphereGeometry args={[0.025, 16, 16]} />
      <meshBasicMaterial color="#facc15" />
    </mesh>
    <Text position={[0.4, 0, 0.02]} fontSize={0.06} color="#ef4444" anchorX="center" anchorY="middle">X</Text>
    <Text position={[0, 0.4, 0]} fontSize={0.06} color="#22c55e" anchorX="center" anchorY="middle">Y</Text>
    <Text position={[0, 0, 0.4]} fontSize={0.06} color="#3b82f6" anchorX="center" anchorY="middle">Z</Text>
  </>
)

const Ur5Robot = ({
  jointValues,
  linearPosition,
  tcpOffset,
  checkMode,
  onSelfCollision,
  onPhysicsCollision,
  isMoving,
  showCollisionBody,
  showVisual,
}: {
  jointValues: Record<string, number>
  linearPosition: { X: number; Y: number; Z: number }
  tcpOffset: { X: number; Y: number; Z: number }
  checkMode: boolean
  onSelfCollision: (colliding: boolean) => void
  onPhysicsCollision: (colliding: boolean) => void
  isMoving: boolean
  showCollisionBody: boolean
  showVisual: boolean
}) => {
  const groupRef = useRef<Group>(null)
  const tcpMarkerRef = useRef<Group>(null)
  const robotRef = useRef<(Group & { setJointValue?: (name: string, value: number) => void }) | null>(null)
  const collisionRobotRef = useRef<(Group & { setJointValue?: (name: string, value: number) => void }) | null>(null)
  const [collisionRobot, setCollisionRobot] = useState<Group | null>(null)
  const [collisionRobotLoaded, setCollisionRobotLoaded] = useState(false)
  const [physicsCollision, setPhysicsCollision] = useState(false)
  const [selfCollision, setSelfCollision] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [robotLoaded, setRobotLoaded] = useState(false)
  const baseLift = 0

  useEffect(() => {
    const loader = new URDFLoader()
    const collisionLoader = new URDFLoader()
    collisionLoader.parseVisual = false
    collisionLoader.parseCollision = true
    const robotGroup = groupRef.current
    loader.load("/ur5.urdf", (robot) => {
      robot.scale.setScalar(0.55)
      robot.position.set(0, 0, 0)
      robot.rotation.set(0, 0, 0)
      robot.traverse((child) => {
        const mesh = child as Mesh
        if (mesh.isMesh) {
          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })
      robotRef.current = robot as unknown as Group & { setJointValue?: (name: string, value: number) => void }
      robotGroup?.add(robot)
      setRobotLoaded(true)
    }, undefined, () => {
      setLoadError("Unable to load /ur5.urdf")
    })
    collisionLoader.load("/ur5.urdf", (collisionRobot) => {
      collisionRobot.scale.setScalar(0.55)
      collisionRobot.rotation.set(0, 0, 0)
      collisionRobotRef.current = collisionRobot as unknown as Group & { setJointValue?: (name: string, value: number) => void }
      collisionRobot.traverse((child) => {
        const mesh = child as Mesh
        if (mesh.isMesh) {
          mesh.visible = false
          mesh.castShadow = false
          mesh.receiveShadow = false
          const material = mesh.material as { color?: { set: (color: string) => void }; transparent?: boolean; opacity?: number; wireframe?: boolean }
          material.color?.set("#f97316")
          material.transparent = true
          material.opacity = 0.28
          material.wireframe = true
        }
      })
      collisionRobot.visible = false
      setCollisionRobot(collisionRobot as unknown as Group)
      setCollisionRobotLoaded(true)
    })

    return () => {
      if (robotGroup) {
        while (robotGroup.children.length > 0) {
          robotGroup.remove(robotGroup.children[0])
        }
      }
    }
  }, [])

  useEffect(() => {
    const setJointValue = robotRef.current?.setJointValue
    const setCollisionJointValue = collisionRobotRef.current?.setJointValue
    if (!setJointValue && !setCollisionJointValue) return
    urdfJointNames.forEach((jointName, index) => {
      const angle = (jointValues[`J${index + 1}`] ?? 0) * Math.PI / 180
      setJointValue?.call(robotRef.current, jointName, angle)
      setCollisionJointValue?.call(collisionRobotRef.current, jointName, angle)
    })
  }, [jointValues, robotLoaded, collisionRobotLoaded])

  useEffect(() => {
    if (collisionRobot) {
      collisionRobot.visible = true
      collisionRobot.traverse((child) => {
        const mesh = child as Mesh
        if (mesh.isMesh) mesh.visible = showCollisionBody
      })
    }
  }, [collisionRobot, showCollisionBody])

  useEffect(() => {
    const robot = robotRef.current
    if (!robot) return
    robot.visible = showVisual
    robot.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as { emissive?: { set: (color: string) => void }; emissiveIntensity?: number }
      material.emissive?.set(physicsCollision || selfCollision ? "#ef4444" : "#000000")
      if (material.emissiveIntensity !== undefined) material.emissiveIntensity = physicsCollision || selfCollision ? 0.8 : 0
    })
  }, [physicsCollision, selfCollision, robotLoaded, showVisual])

  useEffect(() => {
    if (!isMoving) {
      setPhysicsCollision(false)
      setSelfCollision(false)
      onPhysicsCollision(false)
      onSelfCollision(false)
    }
  }, [isMoving, onPhysicsCollision, onSelfCollision])

  useFrame(() => {
    if (!isMoving) return
    const visualLinks = (robotRef.current as unknown as { links?: Record<string, Group> } | null)?.links
    const collisionLinks = (collisionRobotRef.current as unknown as { links?: Record<string, Group> } | null)?.links
    const wrist = visualLinks?.wrist_3_link
    if (!visualLinks || !collisionLinks || !wrist || !groupRef.current?.parent) return
    const tcp = new Vector3(tcpOffset.X / 100, tcpOffset.Y / 100, tcpOffset.Z / 100)
    wrist.localToWorld(tcp)
    groupRef.current.parent.worldToLocal(tcp)
    tcpMarkerRef.current?.position.copy(tcp)
    const linkNames = ["shoulder_link", "upper_arm_link", "forearm_link", "wrist_1_link", "wrist_2_link", "wrist_3_link"]
    const boxes = linkNames.map((name) => {
      const link = collisionLinks[name]
      if (!link) return null
      const box = new Box3().setFromObject(link)
      box.expandByScalar(-0.01)
      return box.isEmpty() ? null : box
    })
    let colliding = false
    for (let first = 0; first < boxes.length && !colliding; first += 1) {
      for (let second = first + 2; second < boxes.length; second += 1) {
        const firstBox = boxes[first]
        const secondBox = boxes[second]
        if (firstBox && secondBox && firstBox.intersectsBox(secondBox)) {
          colliding = true
          break
        }
      }
    }
    if (colliding !== selfCollision) {
      setSelfCollision(colliding)
      onSelfCollision(colliding)
    }
  })

  return (
    <group position={[linearPosition.X / 100, linearPosition.Y / 100, baseLift + linearPosition.Z / 100]}>
      <group ref={groupRef}>
      </group>
      <RigidBody
        type="kinematicPosition"
        colliders="trimesh"
        onCollisionEnter={(event) => {
          if (!isMoving || event.other.rigidBodyObject?.userData?.collisionType === "ground") return
          setPhysicsCollision(true)
          onPhysicsCollision(true)
        }}
        onCollisionExit={(event) => {
          if (!isMoving || event.other.rigidBodyObject?.userData?.collisionType === "ground") return
          setPhysicsCollision(false)
          onPhysicsCollision(false)
        }}
      >
        {collisionRobot && <primitive object={collisionRobot} visible={showCollisionBody} />}
      </RigidBody>
      {isMoving && (physicsCollision || selfCollision) && <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.34, 0.38, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
      </mesh>}
      <group ref={tcpMarkerRef} visible={checkMode}>
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <Line points={[[0, 0, 0], [0.16, 0, 0]]} color="#ef4444" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0.16, 0]]} color="#22c55e" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0, 0.16]]} color="#3b82f6" lineWidth={2} />
      </group>
      {loadError && <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
        <meshBasicMaterial color="#ef4444" wireframe />
      </mesh>}
    </group>
  )
}

export const RealThreeJsViewer = () => {
  const [jogMode, setJogMode] = useState<"joint" | "linear">("joint")
  const [step, setStep] = useState(1)
  const jointValues = useRobotSimulationStore((state) => state.joints)
  const linearPosition = useRobotSimulationStore((state) => state.linear)
  const tcpOffset = useRobotSimulationStore((state) => state.tcp)
  const checkMode = useRobotSimulationStore((state) => state.checkWorkspace)
  const showCollisionBody = useRobotSimulationStore((state) => state.showCollisionBody)
  const showVisual = useRobotSimulationStore((state) => state.showVisual)
  const setJoint = useRobotSimulationStore((state) => state.setJoint)
  const setLinear = useRobotSimulationStore((state) => state.setLinear)
  const setTcp = useRobotSimulationStore((state) => state.setTcp)
  const setCheckMode = useRobotSimulationStore((state) => state.setCheckWorkspace)
  const setShowCollisionBody = useRobotSimulationStore((state) => state.setShowCollisionBody)
  const setShowVisual = useRobotSimulationStore((state) => state.setShowVisual)
  const activeLayer = useRobotSimulationStore((state) => state.activeLayer)
  const kinematicChain = useRobotSimulationStore((state) => state.kinematicChain)
  const isPlaying = useRobotSimulationStore((state) => state.isPlaying)
  const simulationTime = useRobotSimulationStore((state) => state.simulationTime)
  const setPlaying = useRobotSimulationStore((state) => state.setPlaying)
  const stepSimulation = useRobotSimulationStore((state) => state.stepSimulation)
  const resetSimulation = useRobotSimulationStore((state) => state.resetSimulation)
  const [selfCollision, setSelfCollision] = useState(false)
  const [physicsCollision, setPhysicsCollision] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const initializedPose = useRef(false)

  useEffect(() => {
    if (!initializedPose.current) {
      initializedPose.current = true
      return
    }
    setIsMoving(true)
    const timer = window.setTimeout(() => setIsMoving(false), 300)
    return () => window.clearTimeout(timer)
  }, [jointValues, linearPosition])
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const surfaceColor = getIdeColor("--ide-surface-bg")
  const primaryColor = getIdeColor("--primary")
  const borderColor = getIdeColor("--border")

  return (
    <div data-theme={currentTheme} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: surfaceColor }}>
      <div className="absolute right-3 top-3 z-20 w-52 rounded-xl border border-white/10 bg-black/25 p-3 text-[var(--foreground)] shadow-xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ide-text-inactive)]">Jog</p>
            <p className="text-[11px] font-medium">Manual robot motion</p>
          </div>
          <LucideIcons.Move3D className="h-4 w-4 text-[var(--primary)]" />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-white/5 p-1">
          {(["joint", "linear"] as const).map((mode) => (
            <IdeBarItem
              key={mode}
              tooltip={`${mode === "joint" ? "Joint" : "Linear"} jog mode`}
              text={mode === "joint" ? "Joint" : "Linear"}
              side="bottom"
              isActive={jogMode === mode}
              onClick={() => {
                setJogMode(mode)
              }}
              className="h-6 justify-center px-1 text-[10px]"
            />
          ))}
        </div>
        <div className="mb-2 rounded-md border border-white/10 bg-white/5 p-2 text-[10px]">
          <div className="mb-1 text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Robot layer</div>
          <div className="font-mono text-[var(--primary)]">{activeLayer}</div>
          <div className="mt-1 text-[9px] text-[var(--ide-text-inactive)]">{kinematicChain.length} chain nodes</div>
        </div>
        <div className="mb-2 flex items-center gap-1 border-b border-white/10 pb-2">
          <IdeBarItem tooltip={isPlaying ? "Pause simulation" : "Play simulation"} icon={isPlaying ? <LucideIcons.Pause className="h-3.5 w-3.5" /> : <LucideIcons.Play className="h-3.5 w-3.5" />} side="bottom" isActive={isPlaying} className="h-6 w-6 px-0" onClick={() => setPlaying(!isPlaying)} />
          <IdeBarItem tooltip="Step simulation" icon={<LucideIcons.SkipForward className="h-3.5 w-3.5" />} side="bottom" className="h-6 w-6 px-0" onClick={stepSimulation} />
          <IdeBarItem tooltip="Reset robot simulation" icon={<LucideIcons.RotateCcw className="h-3.5 w-3.5" />} side="bottom" className="h-6 w-6 px-0" onClick={resetSimulation} />
          <span className="ml-auto font-mono text-[10px] text-[var(--ide-text-inactive)]">t={simulationTime.toFixed(2)}s</span>
        </div>
        <IdeBarItem
          tooltip="Show workspace and TCP"
          text="Check workspace"
          icon={<LucideIcons.ScanSearch className="h-3.5 w-3.5" />}
          side="bottom"
          isActive={checkMode}
          onClick={() => setCheckMode(!checkMode)}
          className="mb-2 h-7 w-full justify-center text-[10px]"
        />
        {checkMode && <IdeBarItem
          tooltip="Show collision proxy body"
          text={showCollisionBody ? "Hide collision body" : "Show collision body"}
          icon={<LucideIcons.Box className="h-3.5 w-3.5" />}
          side="bottom"
          isActive={showCollisionBody}
          onClick={() => setShowCollisionBody(!showCollisionBody)}
          className="mb-2 h-7 w-full justify-center text-[10px]"
        />}
        {checkMode && <IdeBarItem
          tooltip="Show visual robot body"
          text={showVisual ? "Hide visual body" : "Show visual body"}
          icon={<LucideIcons.Eye className="h-3.5 w-3.5" />}
          side="bottom"
          isActive={showVisual}
          onClick={() => setShowVisual(!showVisual)}
          className="mb-2 h-7 w-full justify-center text-[10px]"
        />}
        {checkMode && (
          <div className="mb-2 space-y-2 rounded-md border border-white/10 bg-white/5 p-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">TCP offset</span>
              <span className={isMoving && (selfCollision || physicsCollision) ? "font-semibold text-red-400" : "text-emerald-400"}>{isMoving && (selfCollision || physicsCollision) ? "Collision" : "Clear"}</span>
            </div>
            {(Object.keys(tcpOffset) as Array<keyof typeof tcpOffset>).map((axis) => (
              <div key={axis}>
                <div className="mb-1 flex justify-between text-[10px]"><span>{axis}</span><span className="font-mono text-[var(--primary)]">{tcpOffset[axis].toFixed(1)} mm</span></div>
                <Slider min={-250} max={250} step={0.1} value={[tcpOffset[axis]]} onValueChange={(values) => {
                  const nextValue = Array.isArray(values) ? values[0] : values
                  setTcp(axis, Number(nextValue))
                }} />
              </div>
            ))}
          </div>
        )}
        <label className="mb-2 block text-[10px] text-[var(--ide-text-inactive)]">Step
          <select value={step} onChange={(event) => setStep(Number(event.target.value))} className="mt-1 h-7 w-full rounded border border-white/10 bg-black/20 px-1 text-[11px] text-[var(--foreground)] outline-none">
            {[0.1, 1, 5, 10].map((value) => <option key={value} value={value}>{value}{jogMode === "joint" ? "°" : " mm / °"}</option>)}
          </select>
        </label>
        {jogMode === "joint" ? (
          <div className="space-y-2">
            {Object.entries(jointValues).map(([joint, value], index) => (
              <div key={joint}>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-[var(--ide-text-inactive)]">{joint} <span className="opacity-60">Joint {index + 1}</span></span>
                  <span className="font-mono text-[var(--primary)]">{value.toFixed(1)}°</span>
                </div>
                <Slider min={-180} max={180} step={0.1} value={[value]} onValueChange={(values) => {
                  const nextValue = Array.isArray(values) ? values[0] : values
                  setJoint(joint, Number(nextValue))
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {(Object.keys(linearPosition) as Array<keyof typeof linearPosition>).map((linearAxis) => (
              <div key={linearAxis} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1">
                <div className="flex items-center gap-1">
                  <span className="w-7 font-semibold text-[10px] text-[var(--ide-text-inactive)]">{linearAxis}</span>
                  <span className="flex-1 text-right font-mono text-[10px] text-[var(--primary)]">{linearPosition[linearAxis].toFixed(1)}{linearAxis.startsWith("R") ? "°" : " mm"}</span>
                </div>
                <Slider
                  min={linearAxis.startsWith("R") ? -180 : -1000}
                  max={linearAxis.startsWith("R") ? 180 : 1000}
                  step={0.1}
                  value={[linearPosition[linearAxis]]}
                  onValueChange={(values) => {
                    const nextValue = Array.isArray(values) ? values[0] : values
                    setLinear(linearAxis, Number(nextValue))
                  }}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Canvas camera={{ position:[2.5,2,2.5], fov: 45, up: [0, 0, 1] }} onCreated={({ camera }) => {
        camera.up.set(0, 0, 1)
        camera.lookAt(0, 0, 0)
      }}>
        <color attach="background" args={[surfaceColor]} />
        <ambientLight intensity={1.1} color="#dbeafe" />
        <hemisphereLight args={["#f8fafc", "#1e293b", 1.2]} />
        <directionalLight
          position={[3, 4, 6]}
          intensity={3.2}
          color="#fff7ed"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <pointLight position={[-3, -2, 2.5]} intensity={1.8} color="#93c5fd" />
        <pointLight position={[2, -1, 3]} intensity={1.4} color="#fca5a5" />
        
        <Physics gravity={[0, 0, -9.81]} interpolate={false}>
          <RigidBody type="fixed" colliders={false} userData={{ collisionType: "ground" }}>
            <CuboidCollider args={[10, 10, 0.02]} position={[0, 0, -0.02]} />
          </RigidBody>
          <Ur5Robot jointValues={jointValues} linearPosition={linearPosition} tcpOffset={tcpOffset} checkMode={checkMode} isMoving={isMoving} showCollisionBody={showCollisionBody} showVisual={showVisual} onSelfCollision={setSelfCollision} onPhysicsCollision={setPhysicsCollision} />
        </Physics>
        {checkMode && <mesh position={[0, 0, 1]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={primaryColor} wireframe transparent opacity={0.2} />
        </mesh>}
        <MeasurementGrid borderColor={borderColor} primaryColor={primaryColor} />
        <OriginIndicator />
        <OrbitControls
          makeDefault 
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI} 
          minDistance={0.5} 
          maxDistance={30} 
        />
      </Canvas>
    </div>
  )
}