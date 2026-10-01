
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Text, Line } from "@react-three/drei"
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier"
import { useThemeStore } from "@/core/store/themeStore"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import * as LucideIcons from "lucide-react"
import { IdeBarItem } from "@/features/ide-shell/components/IdeBarItem"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Box3, Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three"
import { useRobotSimulationStore } from "@/core/store/robotSimulationStore"
import { useProjectStore } from "@/core/store/projectStore"
import { devicesApi } from "@/core/api/devicesApi"
import { robotOrdApi, type OrdDocument } from "@/core/api/robotOrdApi"
import { parseOrdMesh } from "@/features/simulation/lib/parseOrdMesh"
import { applyJointValue, buildOrdRobotGroups, forEachMesh, type OrdRobotGroups } from "@/features/simulation/lib/buildOrdRobot"

const getIdeColor = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

/** Walks up the object graph to check whether `node` lives inside `ancestor`'s subtree (e.g. a mesh inside a selected link). */
const isDescendantOf = (node: Object3D, ancestor: Object3D): boolean => {
  for (let current: Object3D | null = node; current; current = current.parent) {
    if (current === ancestor) return true
  }
  return false
}

/** This renderer's chosen visual scale for the loaded robot — purely a display choice, not part of the .ord data. */
const ROBOT_DISPLAY_SCALE = 0.55

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

const OrdRobot = ({
  projectId,
  deviceId,
  ord,
  jointValues,
  linearPosition,
  tcpOffset,
  checkMode,
  onSelfCollision,
  onPhysicsCollision,
  isMoving,
  showCollisionBody,
  showVisual,
  physicsMode,
  totalMass,
}: {
  projectId: string | null
  deviceId: string | null
  ord: OrdDocument | null
  jointValues: Record<string, number>
  linearPosition: { X: number; Y: number; Z: number }
  tcpOffset: { X: number; Y: number; Z: number }
  checkMode: boolean
  onSelfCollision: (colliding: boolean) => void
  onPhysicsCollision: (colliding: boolean) => void
  isMoving: boolean
  showCollisionBody: boolean
  showVisual: boolean
  physicsMode: "kinematic" | "dynamic"
  totalMass: number
}) => {
  const groupRef = useRef<Group>(null)
  const collisionGroupRef = useRef<Group>(null)
  const tcpMarkerRef = useRef<Group>(null)
  const jointMarkerRef = useRef<Group>(null)
  const [visualGroups, setVisualGroups] = useState<OrdRobotGroups | null>(null)
  const [collisionGroups, setCollisionGroups] = useState<OrdRobotGroups | null>(null)
  const [physicsCollision, setPhysicsCollision] = useState(false)
  const [selfCollision, setSelfCollision] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const baseLift = 0
  const selectedKinematicNode = useRobotSimulationStore((state) => state.selectedKinematicNode)

  // A selected joint has no mesh of its own — highlight the link it actually drives instead.
  const highlightedLinkName = selectedKinematicNode?.kind === "link"
    ? selectedKinematicNode.name
    : selectedKinematicNode?.kind === "joint"
      ? ord?.joints.find((joint) => joint.name === selectedKinematicNode.name)?.child
      : undefined

  // Builds the real scene graph straight from the .ord + its mesh bytes — replaces URDF loading entirely.
  useEffect(() => {
    if (!ord || !projectId || !deviceId) return
    let cancelled = false

    async function buildVariant(meshSet: "visual" | "collision", tintColor?: string) {
      const refs = ord!.meshes[meshSet]
      const buffers = new Map<string, ArrayBuffer>()
      await Promise.all(
        [...new Set(refs.map((ref) => ref.storageKey))].map(async (storageKey) => {
          try {
            buffers.set(storageKey, await robotOrdApi.getMeshArrayBuffer(projectId!, deviceId!, storageKey))
          } catch {
            // Missing mesh file — that link just renders empty rather than failing the whole robot.
          }
        }),
      )
      if (cancelled) return null

      const meshesByLink = new Map<string, Object3D[]>()
      for (const ref of refs) {
        const buffer = buffers.get(ref.storageKey)
        if (!buffer) continue
        const object = await parseOrdMesh(buffer, ref.fileType)
        object.traverse((child) => {
          const mesh = child as Mesh
          if (!mesh.isMesh) return
          mesh.castShadow = meshSet === "visual"
          mesh.receiveShadow = meshSet === "visual"
          if (tintColor) {
            mesh.material = new MeshBasicMaterial({ color: tintColor, wireframe: true, transparent: true, opacity: 0.28 })
          }
        })
        if (!meshesByLink.has(ref.link)) meshesByLink.set(ref.link, [])
        meshesByLink.get(ref.link)!.push(object)
      }

      const groups = buildOrdRobotGroups(ord!, (linkName) => meshesByLink.get(linkName) ?? [])
      groups.root.scale.setScalar(ROBOT_DISPLAY_SCALE)
      if (tintColor) groups.root.visible = false
      return groups
    }

    buildVariant("visual")
      .then((groups) => { if (!cancelled && groups) setVisualGroups(groups) })
      .catch(() => setLoadError("Unable to load the robot's visual meshes"))
    buildVariant("collision", "#f97316")
      .then((groups) => { if (!cancelled && groups) setCollisionGroups(groups) })
      .catch(() => setLoadError("Unable to load the robot's collision meshes"))

    return () => { cancelled = true }
  }, [ord, projectId, deviceId])

  useEffect(() => {
    const parent = groupRef.current
    if (!parent || !visualGroups) return
    parent.add(visualGroups.root)
    return () => { parent.remove(visualGroups.root) }
  }, [visualGroups])

  useEffect(() => {
    const parent = collisionGroupRef.current
    if (!parent || !collisionGroups) return
    parent.add(collisionGroups.root)
    return () => { parent.remove(collisionGroups.root) }
  }, [collisionGroups])

  useEffect(() => {
    if (!ord) return
    for (const [jointName, degreesOrMm] of Object.entries(jointValues)) {
      const joint = ord.joints.find((entry) => entry.name === jointName)
      const value = joint?.type === "prismatic" ? degreesOrMm / 100 : (degreesOrMm * Math.PI) / 180
      if (visualGroups) applyJointValue(visualGroups, ord, jointName, value)
      if (collisionGroups) applyJointValue(collisionGroups, ord, jointName, value)
    }
  }, [jointValues, ord, visualGroups, collisionGroups])

  useEffect(() => {
    if (collisionGroups) collisionGroups.root.visible = showCollisionBody
  }, [collisionGroups, showCollisionBody])

  // Combined highlight/collision tint — collision (robot-wide red flash) always wins over a selection highlight.
  useEffect(() => {
    if (!visualGroups) return
    visualGroups.root.visible = showVisual
    const highlightGroup = highlightedLinkName ? visualGroups.linkGroups.get(highlightedLinkName) : undefined
    forEachMesh(visualGroups.root, (mesh) => {
      const material = mesh.material as { emissive?: { set: (color: string) => void }; emissiveIntensity?: number }
      const isColliding = physicsCollision || selfCollision
      const isHighlighted = !isColliding && Boolean(highlightGroup) && isDescendantOf(mesh, highlightGroup!)
      material.emissive?.set(isColliding ? "#ef4444" : isHighlighted ? "#22d3ee" : "#000000")
      if (material.emissiveIntensity !== undefined) material.emissiveIntensity = isColliding ? 0.8 : isHighlighted ? 0.75 : 0
    })
  }, [visualGroups, physicsCollision, selfCollision, showVisual, highlightedLinkName])

  // The joint frame marker is reparented directly into the selected joint's own axis group, so its
  // position/orientation always matches the joint's live screw-axis pose with zero extra per-frame math.
  useEffect(() => {
    const marker = jointMarkerRef.current
    const jointName = selectedKinematicNode?.kind === "joint" ? selectedKinematicNode.name : undefined
    const axisGroup = jointName ? visualGroups?.jointAxisGroups.get(jointName) : undefined
    if (!marker) return
    if (axisGroup) {
      axisGroup.add(marker)
      marker.visible = true
    } else if (groupRef.current) {
      groupRef.current.add(marker)
      marker.visible = false
    }
  }, [selectedKinematicNode, visualGroups])

  useEffect(() => {
    if (!isMoving) {
      setPhysicsCollision(false)
      setSelfCollision(false)
      onPhysicsCollision(false)
      onSelfCollision(false)
    }
  }, [isMoving, onPhysicsCollision, onSelfCollision])

  useFrame(() => {
    if (!isMoving || !visualGroups || !collisionGroups || !groupRef.current?.parent) return
    const tcpLink = visualGroups.tcpLinkName ? visualGroups.linkGroups.get(visualGroups.tcpLinkName) : undefined
    if (!tcpLink) return
    const tcp = new Vector3(tcpOffset.X / 100, tcpOffset.Y / 100, tcpOffset.Z / 100)
    tcpLink.localToWorld(tcp)
    groupRef.current.parent.worldToLocal(tcp)
    tcpMarkerRef.current?.position.copy(tcp)

    const linkNames = [...collisionGroups.linkGroups.keys()]
    const boxes = linkNames.map((name) => {
      const box = new Box3().setFromObject(collisionGroups.linkGroups.get(name)!)
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
        type={physicsMode === "dynamic" ? "dynamic" : "kinematicPosition"}
        mass={physicsMode === "dynamic" ? Math.max(totalMass, 0.1) : undefined}
        // Building a trimesh collider from an empty group (before meshes finish loading) crashes Rapier — defer until real geometry exists.
        colliders={collisionGroups ? "trimesh" : false}
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
        <group ref={collisionGroupRef} visible={showCollisionBody} />
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
      {/* 3D frame marker for the selected joint — lives wherever `axisGroup.add(marker)` last put it (see effect above). */}
      <group ref={jointMarkerRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        <Line points={[[0, 0, 0], [0.2, 0, 0]]} color="#ef4444" lineWidth={3} />
        <Line points={[[0, 0, 0], [0, 0.2, 0]]} color="#22c55e" lineWidth={3} />
        <Line points={[[0, 0, 0], [0, 0, 0.2]]} color="#3b82f6" lineWidth={3} />
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
  const [panelTab, setPanelTab] = useState<"motion" | "physics">("motion")
  const [physicsSubTab, setPhysicsSubTab] = useState<"mode" | "link" | "joint">("mode")
  const [step, setStep] = useState(1)
  const projectId = useProjectStore((state) => state.activeProjectId)
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
  const loadedOrd = useRobotSimulationStore((state) => state.loadedOrd)
  const setLoadedOrd = useRobotSimulationStore((state) => state.setLoadedOrd)
  const updateLinkProperties = useRobotSimulationStore((state) => state.updateLinkProperties)
  const updateJointProperties = useRobotSimulationStore((state) => state.updateJointProperties)
  const physicsMode = useRobotSimulationStore((state) => state.physicsMode)
  const setPhysicsMode = useRobotSimulationStore((state) => state.setPhysicsMode)
  const selectedKinematicNode = useRobotSimulationStore((state) => state.selectedKinematicNode)
  const setSelectedKinematicNode = useRobotSimulationStore((state) => state.setSelectedKinematicNode)
  const isPlaying = useRobotSimulationStore((state) => state.isPlaying)
  const simulationTime = useRobotSimulationStore((state) => state.simulationTime)
  const setPlaying = useRobotSimulationStore((state) => state.setPlaying)
  const stepSimulation = useRobotSimulationStore((state) => state.stepSimulation)
  const resetSimulation = useRobotSimulationStore((state) => state.resetSimulation)
  const [selfCollision, setSelfCollision] = useState(false)
  const [physicsCollision, setPhysicsCollision] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const initializedPose = useRef(false)
  const queryClient = useQueryClient()

  const devicesQuery = useQuery({
    queryKey: ["devices", projectId],
    queryFn: () => devicesApi.list(projectId!),
    enabled: Boolean(projectId),
  })
  const robotDevice = devicesQuery.data?.find((device) => device.kind === "robot")

  const ordQuery = useQuery({
    queryKey: ["robot-ord", projectId, robotDevice?.id],
    queryFn: () => robotOrdApi.getOrd(projectId!, robotDevice!.id),
    enabled: Boolean(projectId && robotDevice),
  })

  useEffect(() => {
    if (ordQuery.data) setLoadedOrd(ordQuery.data)
  }, [ordQuery.data, setLoadedOrd])

  const saveOrdMutation = useMutation({
    mutationFn: () => robotOrdApi.updateOrd(projectId!, robotDevice!.id, loadedOrd!),
    onSuccess: (ord) => queryClient.setQueryData(["robot-ord", projectId, robotDevice?.id], ord),
  })

  const totalMass = useMemo(() => loadedOrd?.links.reduce((sum, link) => sum + link.mass, 0) ?? 0, [loadedOrd])

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
  const linearAxes = Object.keys(linearPosition) as Array<keyof typeof linearPosition>

  // Jog a link/joint selected in the explorer, if any — else fall back to the first entry so the tab isn't empty.
  const selectedLinkName = selectedKinematicNode?.kind === "link" ? selectedKinematicNode.name : loadedOrd?.links[0]?.name
  const selectedJointName = selectedKinematicNode?.kind === "joint"
    ? selectedKinematicNode.name
    : loadedOrd?.joints.find((joint) => joint.type !== "fixed")?.name
  const editingLink = loadedOrd?.links.find((link) => link.name === selectedLinkName)
  const editingJoint = loadedOrd?.joints.find((joint) => joint.name === selectedJointName)


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
          {(["motion", "physics"] as const).map((tab) => (
            <IdeBarItem
              key={tab}
              tooltip={tab === "motion" ? "Jog the robot" : "Physics, mass, inertia & joint limits"}
              text={tab === "motion" ? "Motion" : "Physics"}
              side="bottom"
              isActive={panelTab === tab}
              onClick={() => setPanelTab(tab)}
              className="h-6 justify-center px-1 text-[10px]"
            />
          ))}
        </div>
        {panelTab === "motion" ? (
        <>
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
          <div className="mt-1 text-[9px] text-[var(--ide-text-inactive)]">{loadedOrd ? `${loadedOrd.links.length} links, ${loadedOrd.joints.length} joints` : "No robot loaded"}</div>
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
              <span className={isMoving && (selfCollision || physicsCollision) ? "font-semibold text-destructive" : "text-emerald-400"}>{isMoving && (selfCollision || physicsCollision) ? "Collision" : "Clear"}</span>
            </div>
            {(Object.keys(tcpOffset) as Array<keyof typeof tcpOffset>).map((axis) => (
              <div key={axis}>
                <div className="mb-1 flex justify-between text-[10px]"><span>{axis}</span><span className="font-mono text-[var(--primary)]">{tcpOffset[axis].toFixed(1)} mm</span></div>
                <Slider min={-250} max={250} step={0.1} value={[tcpOffset[axis]]} onValueChange={(values) => {
                  const nextValue = Array.isArray(values) ? Number(values[0]) : Number(values)
                  setTcp(axis, nextValue)
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
            {Object.entries(jointValues).map(([joint, value], index) => {
              const jointDef = loadedOrd?.joints.find((entry) => entry.name === joint)
              const isPrismatic = jointDef?.type === "prismatic"
              const toDeg = (rad: number) => (rad * 180) / Math.PI
              const min = isPrismatic ? (jointDef?.limits?.lower ?? -1) * 100 : jointDef?.limits?.lower !== undefined ? toDeg(jointDef.limits.lower) : -180
              const max = isPrismatic ? (jointDef?.limits?.upper ?? 1) * 100 : jointDef?.limits?.upper !== undefined ? toDeg(jointDef.limits.upper) : 180
              return (
                <div key={joint}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ide-text-inactive)]">{joint} <span className="opacity-60">Joint {index + 1}</span></span>
                    <span className="font-mono text-[var(--primary)]">{value.toFixed(1)}{isPrismatic ? " mm" : "°"}</span>
                  </div>
                  <Slider min={min} max={max} step={0.1} value={[value]} onValueChange={(values) => {
                    const nextValue = Array.isArray(values) ? Number(values[0]) : Number(values)
                    setJoint(joint, nextValue)
                  }} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {linearAxes.map((linearAxis) => {
              const axisName = String(linearAxis)
              return (
                <div key={axisName} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1">
                  <div className="flex items-center gap-1">
                    <span className="w-7 font-semibold text-[10px] text-[var(--ide-text-inactive)]">{axisName}</span>
                    <span className="flex-1 text-right font-mono text-[10px] text-[var(--primary)]">{linearPosition[linearAxis].toFixed(1)}{axisName.startsWith("R") ? "°" : " mm"}</span>
                  </div>
                  <Slider
                    min={axisName.startsWith("R") ? -180 : -1000}
                    max={axisName.startsWith("R") ? 180 : 1000}
                    step={0.1}
                    value={[linearPosition[linearAxis]]}
                    onValueChange={(values) => {
                      const nextValue = Array.isArray(values) ? Number(values[0]) : Number(values)
                      setLinear(linearAxis, nextValue)
                    }}
                    className="mt-1"
                  />
                </div>
              )
            })}
          </div>
        )}
        </>
        ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-white/5 p-1">
            {(["mode", "link", "joint"] as const).map((tab) => (
              <IdeBarItem key={tab} tooltip={tab} text={tab === "mode" ? "Mode" : tab === "link" ? "Link" : "Joint"} side="bottom" isActive={physicsSubTab === tab} onClick={() => setPhysicsSubTab(tab)} className="h-6 justify-center px-1 text-[10px]" />
            ))}
          </div>

          {physicsSubTab === "mode" && (
            <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-2 text-[10px]">
              <p className="text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Rapier simulation mode</p>
              <div className="grid grid-cols-2 gap-1">
                <IdeBarItem tooltip="Pose driven by the jog sliders only" text="Kinematic" side="bottom" isActive={physicsMode === "kinematic"} onClick={() => setPhysicsMode("kinematic")} className="h-6 justify-center px-1 text-[10px]" />
                <IdeBarItem tooltip="A single rigid body using the summed link mass, affected by gravity/collisions" text="Dynamic" side="bottom" isActive={physicsMode === "dynamic"} onClick={() => setPhysicsMode("dynamic")} className="h-6 justify-center px-1 text-[10px]" />
              </div>
              <p className="text-[9px] leading-snug text-[var(--ide-text-inactive)]">Total mass: <span className="font-mono text-[var(--primary)]">{totalMass.toFixed(2)} kg</span>. Dynamic mode is a simplified whole-body stand-in — not per-joint articulated dynamics.</p>
            </div>
          )}

          {physicsSubTab === "link" && (
            <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-2 text-[10px]">
              <label className="block text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Link
                <select value={selectedLinkName ?? ""} onChange={(event) => setSelectedKinematicNode({ kind: "link", name: event.target.value })} className="mt-1 h-7 w-full rounded border border-white/10 bg-black/20 px-1 text-[11px] text-[var(--foreground)] outline-none">
                  {loadedOrd?.links.map((link) => <option key={link.name} value={link.name}>{link.name}</option>)}
                </select>
              </label>
              {editingLink && (
                <>
                  <label className="block">Mass (kg)
                    <Input type="number" step="0.01" value={editingLink.mass} onChange={(event) => updateLinkProperties(editingLink.name, { mass: Number(event.target.value) })} className="mt-1 h-6 text-[11px]" />
                  </label>
                  <div>
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Inertia tensor (ixx, iyy, izz, ixy, ixz, iyz)</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(["ixx", "iyy", "izz", "ixy", "ixz", "iyz"] as const).map((label, index) => (
                        <Input key={label} type="number" step="0.001" title={label} value={editingLink.inertia[index]} onChange={(event) => {
                          const inertia = [...editingLink.inertia] as typeof editingLink.inertia
                          inertia[index] = Number(event.target.value)
                          updateLinkProperties(editingLink.name, { inertia })
                        }} className="h-6 text-[10px]" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {physicsSubTab === "joint" && (
            <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-2 text-[10px]">
              <label className="block text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Joint
                <select value={selectedJointName ?? ""} onChange={(event) => setSelectedKinematicNode({ kind: "joint", name: event.target.value })} className="mt-1 h-7 w-full rounded border border-white/10 bg-black/20 px-1 text-[11px] text-[var(--foreground)] outline-none">
                  {loadedOrd?.joints.filter((joint) => joint.type !== "fixed").map((joint) => <option key={joint.name} value={joint.name}>{joint.name}</option>)}
                </select>
              </label>
              {editingJoint && (
                <>
                  <div className="grid grid-cols-2 gap-1">
                    <label className="block">Lower
                      <Input type="number" step="0.01" value={editingJoint.limits?.lower ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { limits: { ...editingJoint.limits, lower: Number(event.target.value) } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                    <label className="block">Upper
                      <Input type="number" step="0.01" value={editingJoint.limits?.upper ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { limits: { ...editingJoint.limits, upper: Number(event.target.value) } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                    <label className="block">Velocity
                      <Input type="number" step="0.01" value={editingJoint.limits?.velocity ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { limits: { ...editingJoint.limits, velocity: Number(event.target.value) } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                    <label className="block">Effort
                      <Input type="number" step="0.01" value={editingJoint.limits?.effort ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { limits: { ...editingJoint.limits, effort: Number(event.target.value) } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                    <label className="block">Friction
                      <Input type="number" step="0.01" value={editingJoint.dynamics?.friction ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { dynamics: { friction: Number(event.target.value), damping: editingJoint.dynamics?.damping ?? 0 } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                    <label className="block">Damping
                      <Input type="number" step="0.01" value={editingJoint.dynamics?.damping ?? 0} onChange={(event) => updateJointProperties(editingJoint.name, { dynamics: { friction: editingJoint.dynamics?.friction ?? 0, damping: Number(event.target.value) } })} className="mt-1 h-6 text-[11px]" />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          <Button
            size="sm"
            disabled={!loadedOrd || saveOrdMutation.isPending}
            onClick={() => saveOrdMutation.mutate()}
            className="h-7 w-full justify-center gap-2 bg-[var(--primary)] text-[11px] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40"
          >
            <LucideIcons.Save className="h-3.5 w-3.5" />
            {saveOrdMutation.isPending ? "Saving…" : "Save to .ord"}
          </Button>
          {saveOrdMutation.isError && <p className="text-[10px] text-destructive">Failed to save changes.</p>}
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
          <OrdRobot
            projectId={projectId}
            deviceId={robotDevice?.id ?? null}
            ord={loadedOrd}
            jointValues={jointValues}
            linearPosition={linearPosition}
            tcpOffset={tcpOffset}
            checkMode={checkMode}
            isMoving={isMoving}
            showCollisionBody={showCollisionBody}
            showVisual={showVisual}
            physicsMode={physicsMode}
            totalMass={totalMass}
            onSelfCollision={setSelfCollision}
            onPhysicsCollision={setPhysicsCollision}
          />
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