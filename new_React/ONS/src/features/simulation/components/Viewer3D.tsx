
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Text, Line } from "@react-three/drei"
import { Physics, RigidBody, CuboidCollider, ConvexHullCollider } from "@react-three/rapier"
import { useThemeStore } from "@/core/store/themeStore"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import * as LucideIcons from "lucide-react"
import { IdeBarItem } from "@/features/ide-shell/components/IdeBarItem"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DoubleSide, Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three"
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js"
import { useRobotSimulationStore, type RobotPose } from "@/core/store/robotSimulationStore"
import { useProjectStore } from "@/core/store/projectStore"
import { devicesApi } from "@/core/api/devicesApi"
import { robotOrdApi, type OrdDocument } from "@/core/api/robotOrdApi"
import { parseOrdMesh } from "@/features/simulation/lib/parseOrdMesh"
import { applyJointValue, buildOrdRobotGroups, forEachMesh, sampleTcpReach, type OrdRobotGroups } from "@/features/simulation/lib/buildOrdRobot"
import { checkRobotCollisions, computeLinkHullColliders, createRobotCollisionModel, linkMassProperties, type LinkHullCollider, type RobotCollisionModel } from "@/features/simulation/lib/robotCollision"

const getIdeColor = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

/** Nearest link group above `node` — link groups are nested along the chain, so plain ancestry would match every downstream link. */
const owningLinkGroup = (node: Object3D, linkGroups: Set<Object3D>): Object3D | undefined => {
  for (let current: Object3D | null = node; current; current = current.parent) {
    if (linkGroups.has(current)) return current
  }
  return undefined
}

/** This renderer's chosen visual scale for the loaded robot — purely a display choice, not part of the .ord data. */
const ROBOT_DISPLAY_SCALE = 0.55

const ReachEnvelope = ({ ord, tcpOffset, color }: { ord: OrdDocument; tcpOffset: { X: number; Y: number; Z: number }; color: string }) => {
  const geometry = useMemo(() => {
    const samples = sampleTcpReach(ord, [tcpOffset.X / 1000, tcpOffset.Y / 1000, tcpOffset.Z / 1000], ROBOT_DISPLAY_SCALE)
    if (samples.length < 12) return null
    const positions: Vector3[] = []
    for (let index = 0; index < samples.length; index += 3) {
      positions.push(new Vector3(samples[index], samples[index + 1], samples[index + 2]))
    }
    return new ConvexGeometry(positions)
  }, [ord, tcpOffset.X, tcpOffset.Y, tcpOffset.Z])
  useEffect(() => () => geometry?.dispose(), [geometry])
  if (!geometry) return null
  return <mesh geometry={geometry}><meshBasicMaterial color={color} side={DoubleSide} transparent opacity={0.11} depthWrite={false} /></mesh>
}

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
  showTcpFrame,
  onSelfCollision,
  onPhysicsCollision,
  showCollisionBody,
  showVisual,
  physicsMode,
}: {
  projectId: string | null
  deviceId: string | null
  ord: OrdDocument | null
  jointValues: Record<string, number>
  linearPosition: RobotPose["linear"]
  tcpOffset: { X: number; Y: number; Z: number }
  showTcpFrame: boolean
  onSelfCollision: (colliding: boolean) => void
  onPhysicsCollision: (colliding: boolean) => void
  showCollisionBody: boolean
  showVisual: boolean
  physicsMode: "kinematic" | "dynamic"
}) => {
  const tcpMarkerRef = useRef<Group>(null)
  const jointMarkerRef = useRef<Group>(null)
  const [visualGroups, setVisualGroups] = useState<OrdRobotGroups | null>(null)
  const [collisionGroups, setCollisionGroups] = useState<OrdRobotGroups | null>(null)
  const [collisionModel, setCollisionModel] = useState<RobotCollisionModel | null>(null)
  // State (not a ref) because the body group remounts when it moves in/out of the dynamic RigidBody.
  const [bodyGroup, setBodyGroup] = useState<Group | null>(null)
  const [hullColliders, setHullColliders] = useState<{ version: number; colliders: LinkHullCollider[] }>({ version: 0, colliders: [] })
  const [collidingLinks, setCollidingLinks] = useState<Set<string>>(new Set())
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
    let collisionLoadTimer: number | undefined

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
      .then((groups) => {
        if (cancelled || !groups) return
        setVisualGroups(groups)
        collisionLoadTimer = window.setTimeout(() => {
          buildVariant("collision", "#f97316")
            .then((collisionVariant) => {
              if (cancelled || !collisionVariant) return
              setCollisionModel(createRobotCollisionModel(collisionVariant, ord!))
              setCollisionGroups(collisionVariant)
            })
            .catch(() => setLoadError("Unable to load the robot's collision meshes"))
        }, 500)
      })
      .catch(() => setLoadError("Unable to load the robot's visual meshes"))

    return () => {
      cancelled = true
      if (collisionLoadTimer !== undefined) window.clearTimeout(collisionLoadTimer)
    }
  }, [ord, projectId, deviceId])

  useEffect(() => {
    if (!bodyGroup || !visualGroups) return
    bodyGroup.add(visualGroups.root)
    return () => { bodyGroup.remove(visualGroups.root) }
  }, [bodyGroup, visualGroups])

  useEffect(() => {
    if (!bodyGroup || !collisionGroups) return
    bodyGroup.add(collisionGroups.root)
    return () => { bodyGroup.remove(collisionGroups.root) }
  }, [bodyGroup, collisionGroups])

  // Displayed joint values chase the jog targets at each joint's velocity limit (see useFrame).
  const currentJoints = useRef<Record<string, number>>({})
  const hullsStale = useRef(false)
  const lastHullUpdate = useRef(0)
  useEffect(() => { currentJoints.current = {} }, [visualGroups, collisionGroups])

  const refreshHulls = () => {
    if (physicsMode !== "dynamic" || !collisionModel || !collisionGroups || !bodyGroup) return
    setHullColliders((previous) => ({ version: previous.version + 1, colliders: computeLinkHullColliders(collisionModel, collisionGroups) }))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refreshHulls, [physicsMode, collisionModel, collisionGroups, bodyGroup])

  useEffect(() => {
    if (collisionGroups) collisionGroups.root.visible = showCollisionBody
  }, [collisionGroups, showCollisionBody])

  // Combined highlight/collision tint — a colliding link's red always wins over the selection highlight.
  useEffect(() => {
    if (!visualGroups) return
    visualGroups.root.visible = showVisual
    const highlightGroup = highlightedLinkName ? visualGroups.linkGroups.get(highlightedLinkName) : undefined
    const allLinkGroups = new Set<Object3D>(visualGroups.linkGroups.values())
    forEachMesh(visualGroups.root, (mesh) => {
      const linkGroup = owningLinkGroup(mesh, allLinkGroups)
      const isColliding = Boolean(linkGroup && collidingLinks.has(linkGroup.name))
      const isHighlighted = !isColliding && Boolean(highlightGroup) && linkGroup === highlightGroup
      // Multi-material DAE meshes (e.g. UR5 base.dae) carry an array of materials.
      const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as { emissive?: { set: (color: string) => void }; emissiveIntensity?: number }[]
      for (const material of materials) {
        material.emissive?.set(isColliding ? "#ef4444" : isHighlighted ? "#22d3ee" : "#000000")
        if (material.emissiveIntensity !== undefined) material.emissiveIntensity = isColliding ? 0.8 : isHighlighted ? 0.75 : 0
      }
    })
  }, [visualGroups, collidingLinks, showVisual, highlightedLinkName])

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
    } else if (bodyGroup) {
      bodyGroup.add(marker)
      marker.visible = false
    }
  }, [selectedKinematicNode, visualGroups, bodyGroup])

  const lastCollisionKey = useRef("")
  const poseDirty = useRef(true)
  useEffect(() => { poseDirty.current = true }, [jointValues, linearPosition, collisionModel])
  useFrame((state, delta) => {
    if (ord) {
      let moved = false
      for (const [jointName, target] of Object.entries(jointValues)) {
        const joint = ord.joints.find((entry) => entry.name === jointName)
        const isPrismatic = joint?.type === "prismatic"
        const current = currentJoints.current[jointName]
        let next = target
        if (current !== undefined && joint?.limits?.velocity) {
          const maxStep = joint.limits.velocity * (isPrismatic ? 1000 : 180 / Math.PI) * Math.min(delta, 0.1)
          next = current + Math.max(-maxStep, Math.min(maxStep, target - current))
        }
        if (next === current) continue
        currentJoints.current[jointName] = next
        const value = isPrismatic ? next / 1000 : (next * Math.PI) / 180
        if (visualGroups) applyJointValue(visualGroups, ord, jointName, value)
        if (collisionGroups) applyJointValue(collisionGroups, ord, jointName, value)
        moved = true
      }
      if (moved) {
        poseDirty.current = true
        hullsStale.current = true
      }
      // Rebuilding hulls is costly, so throttle while moving and always refresh once motion settles.
      if (hullsStale.current && (!moved || state.clock.elapsedTime - lastHullUpdate.current > 0.15)) {
        hullsStale.current = false
        lastHullUpdate.current = state.clock.elapsedTime
        refreshHulls()
      }
    }

    if (!visualGroups || !collisionGroups || !collisionModel || !tcpMarkerRef.current?.parent) return
    const tcpLink = visualGroups.tcpLinkName ? visualGroups.linkGroups.get(visualGroups.tcpLinkName) : undefined
    if (tcpLink) {
      const tcp = new Vector3(tcpOffset.X / 1000, tcpOffset.Y / 1000, tcpOffset.Z / 1000)
      tcpLink.localToWorld(tcp)
      tcpMarkerRef.current.parent.worldToLocal(tcp)
      tcpMarkerRef.current.position.copy(tcp)
    }

    if (!poseDirty.current && physicsMode !== "dynamic") return
    poseDirty.current = false
    const { selfPairs, groundLinks } = checkRobotCollisions(collisionModel, collisionGroups.root)
    const key = `${selfPairs.map((pair) => pair.join("+")).join(",")}|${groundLinks.join(",")}`
    if (key === lastCollisionKey.current) return
    lastCollisionKey.current = key
    setCollidingLinks(new Set([...selfPairs.flat(), ...groundLinks]))
    onSelfCollision(selfPairs.length > 0)
    onPhysicsCollision(groundLinks.length > 0)
  })

  return (
    <group
      position={[linearPosition.X / 1000, linearPosition.Y / 1000, baseLift + linearPosition.Z / 1000]}
      rotation={[(linearPosition.RX * Math.PI) / 180, (linearPosition.RY * Math.PI) / 180, (linearPosition.RZ * Math.PI) / 180, "ZYX"]}
    >
      {physicsMode === "dynamic" ? (
        <RigidBody type="dynamic" colliders={false}>
          <group ref={setBodyGroup} />
          {hullColliders.colliders.map((hull) => {
            const link = ord?.links.find((entry) => entry.name === hull.name)
            const massProperties = link ? linkMassProperties(link, hull.scale) : undefined
            return (
              <ConvexHullCollider
                key={`${hull.name}:${hullColliders.version}`}
                args={[hull.vertices]}
                position={hull.position}
                rotation={hull.rotation}
                {...(massProperties ? { massProperties } : { mass: Math.max(link?.mass ?? 0, 0.01) })}
              />
            )
          })}
        </RigidBody>
      ) : (
        <group ref={setBodyGroup} />
      )}
      {collidingLinks.size > 0 && <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.34, 0.38, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
      </mesh>}
      <group ref={tcpMarkerRef} visible={showTcpFrame}>
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
  const [panelTab, setPanelTab] = useState<"jog" | "view" | "physics">("jog")
  const [physicsSubTab, setPhysicsSubTab] = useState<"mode" | "link" | "joint">("mode")
  const [step, setStep] = useState(1)
  const projectId = useProjectStore((state) => state.activeProjectId)
  const jointValues = useRobotSimulationStore((state) => state.joints)
  const linearPosition = useRobotSimulationStore((state) => state.linear)
  const tcpOffset = useRobotSimulationStore((state) => state.tcp)
  const checkMode = useRobotSimulationStore((state) => state.checkWorkspace)
  const showTcpFrame = useRobotSimulationStore((state) => state.showTcpFrame)
  const showCollisionBody = useRobotSimulationStore((state) => state.showCollisionBody)
  const showVisual = useRobotSimulationStore((state) => state.showVisual)
  const setJoint = useRobotSimulationStore((state) => state.setJoint)
  const setLinear = useRobotSimulationStore((state) => state.setLinear)
  const setTcp = useRobotSimulationStore((state) => state.setTcp)
  const setCheckMode = useRobotSimulationStore((state) => state.setCheckWorkspace)
  const setShowTcpFrame = useRobotSimulationStore((state) => state.setShowTcpFrame)
  const setShowCollisionBody = useRobotSimulationStore((state) => state.setShowCollisionBody)
  const setShowVisual = useRobotSimulationStore((state) => state.setShowVisual)
  const loadedOrd = useRobotSimulationStore((state) => state.loadedOrd)
  const setLoadedOrd = useRobotSimulationStore((state) => state.setLoadedOrd)
  const updateLinkProperties = useRobotSimulationStore((state) => state.updateLinkProperties)
  const updateJointProperties = useRobotSimulationStore((state) => state.updateJointProperties)
  const physicsMode = useRobotSimulationStore((state) => state.physicsMode)
  const setPhysicsMode = useRobotSimulationStore((state) => state.setPhysicsMode)
  const selectedKinematicNode = useRobotSimulationStore((state) => state.selectedKinematicNode)
  const setSelectedKinematicNode = useRobotSimulationStore((state) => state.setSelectedKinematicNode)
  const resetSimulation = useRobotSimulationStore((state) => state.resetSimulation)
  const [selfCollision, setSelfCollision] = useState(false)
  const [physicsCollision, setPhysicsCollision] = useState(false)
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
      <div className="absolute right-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] w-[min(19rem,calc(100%-1.5rem))] flex-col rounded-xl border border-ide-glass-border bg-ide-glass text-[var(--foreground)] shadow-xl shadow-ide backdrop-blur-md">
      <div className="shrink-0 border-b border-ide-glass-border px-3 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Robot control</p>
            <p className="text-[10px] text-[var(--ide-text-inactive)]">{loadedOrd?.name ?? "No robot loaded"}</p>
          </div>
          <LucideIcons.Move3D className="h-4 w-4 text-[var(--primary)]" />
        </div>
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-ide-glass-surface p-1">
          {(["jog", "view", "physics"] as const).map((tab) => (
            <IdeBarItem
              key={tab}
              tooltip={tab === "jog" ? "Command joint and base motion" : tab === "view" ? "Robot and workspace visibility" : "Simulation and robot properties"}
              text={tab === "jog" ? "Jog" : tab === "view" ? "View" : "Physics"}
              side="bottom"
              isActive={panelTab === tab}
              onClick={() => setPanelTab(tab)}
              className="h-6 justify-center px-1 text-[10px]"
            />
          ))}
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto p-3">
        <div className="mb-3 flex items-center justify-between border-b border-ide-glass-border pb-2 text-[10px]">
          <span className="text-[var(--ide-text-inactive)]">{loadedOrd ? `${loadedOrd.links.length} links · ${loadedOrd.joints.length} joints` : "No model"}</span>
          <span className={selfCollision || physicsCollision ? "font-semibold text-destructive" : "text-status-success"}>
            {selfCollision ? "Self collision" : physicsCollision ? "Ground contact" : "Clear"}
          </span>
        </div>
        {panelTab === "jog" ? (
        <>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-ide-glass-surface p-1">
          {(["joint", "linear"] as const).map((mode) => (
            <IdeBarItem
              key={mode}
              tooltip={mode === "joint" ? "Set joint targets" : "Move the whole robot base"}
              text={mode === "joint" ? "Joints" : "Base pose"}
              side="bottom"
              isActive={jogMode === mode}
              onClick={() => {
                setJogMode(mode)
              }}
              className="h-6 justify-center px-1 text-[10px]"
            />
          ))}
        </div>
        <div className="mb-2 flex items-center justify-end border-b border-ide-glass-border pb-2">
          <IdeBarItem tooltip="Reset joint targets and base pose" text="Reset pose" icon={<LucideIcons.RotateCcw className="h-3.5 w-3.5" />} side="bottom" className="h-7 px-2 text-[10px]" onClick={resetSimulation} />
        </div>
        <label className="mb-2 block text-[10px] text-[var(--ide-text-inactive)]">Jog resolution
          <select value={step} onChange={(event) => setStep(Number(event.target.value))} className="mt-1 h-7 w-full rounded border border-ide-glass-border bg-ide-glass-input px-1 text-[11px] text-[var(--foreground)] outline-none">
            {[0.1, 1, 5, 10].map((value) => <option key={value} value={value}>{value}{jogMode === "joint" ? "°" : " mm / °"}</option>)}
          </select>
        </label>
        {jogMode === "joint" ? (
          <div className="space-y-2">
            {Object.entries(jointValues).map(([joint, value], index) => {
              const jointDef = loadedOrd?.joints.find((entry) => entry.name === joint)
              const isPrismatic = jointDef?.type === "prismatic"
              const toDeg = (rad: number) => (rad * 180) / Math.PI
              const min = isPrismatic ? (jointDef?.limits?.lower ?? -1) * 1000 : jointDef?.limits?.lower !== undefined ? toDeg(jointDef.limits.lower) : -180
              const max = isPrismatic ? (jointDef?.limits?.upper ?? 1) * 1000 : jointDef?.limits?.upper !== undefined ? toDeg(jointDef.limits.upper) : 180
              return (
                <div key={joint}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ide-text-inactive)]">{joint} <span className="opacity-60">Joint {index + 1}</span></span>
                    <span className="font-mono text-[var(--primary)]">{value.toFixed(1)}{isPrismatic ? " mm" : "°"}</span>
                  </div>
                  <Slider min={min} max={max} step={step} value={[value]} onValueChange={(values) => {
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
                <div key={axisName} className="rounded-md border border-ide-glass-border bg-ide-glass-surface px-1.5 py-1">
                  <div className="flex items-center gap-1">
                    <span className="w-7 font-semibold text-[10px] text-[var(--ide-text-inactive)]">{axisName}</span>
                    <span className="flex-1 text-right font-mono text-[10px] text-[var(--primary)]">{linearPosition[linearAxis].toFixed(1)}{axisName.startsWith("R") ? "°" : " mm"}</span>
                  </div>
                  <Slider
                    min={axisName.startsWith("R") ? -180 : -1000}
                    max={axisName.startsWith("R") ? 180 : 1000}
                    step={step}
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
        ) : panelTab === "view" ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--ide-text-inactive)]">Visibility</p>
            <div className="grid grid-cols-2 gap-1">
              <IdeBarItem tooltip="Show the rendered robot" text="Visual" icon={<LucideIcons.Eye className="h-3.5 w-3.5" />} side="bottom" isActive={showVisual} onClick={() => setShowVisual(!showVisual)} className="h-8 justify-center text-[10px]" />
              <IdeBarItem tooltip="Show the collision meshes" text="Collision" icon={<LucideIcons.Box className="h-3.5 w-3.5" />} side="bottom" isActive={showCollisionBody} onClick={() => setShowCollisionBody(!showCollisionBody)} className="h-8 justify-center text-[10px]" />
              <IdeBarItem tooltip="Show the joint-limited TCP reach envelope (includes unreachable pockets)" text="TCP reach" icon={<LucideIcons.ScanSearch className="h-3.5 w-3.5" />} side="bottom" isActive={checkMode} onClick={() => setCheckMode(!checkMode)} className="h-8 justify-center text-[10px]" />
              <IdeBarItem tooltip="Show the live tool-centre-point frame" text="TCP frame" icon={<LucideIcons.Crosshair className="h-3.5 w-3.5" />} side="bottom" isActive={showTcpFrame} onClick={() => setShowTcpFrame(!showTcpFrame)} className="h-8 justify-center text-[10px]" />
            </div>
          </div>
          <div className="space-y-2 border-t border-ide-glass-border pt-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--ide-text-inactive)]">TCP offset</p>
            {(Object.keys(tcpOffset) as Array<keyof typeof tcpOffset>).map((axis) => (
              <div key={axis}>
                <div className="mb-1 flex justify-between text-[10px]"><span>{axis}</span><span className="font-mono text-[var(--primary)]">{tcpOffset[axis].toFixed(1)} mm</span></div>
                <Slider min={-250} max={250} step={0.1} value={[tcpOffset[axis]]} onValueChange={(values) => setTcp(axis, Number(Array.isArray(values) ? values[0] : values))} />
              </div>
            ))}
          </div>
        </div>
        ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-ide-glass-surface p-1">
            {(["mode", "link", "joint"] as const).map((tab) => (
              <IdeBarItem key={tab} tooltip={tab} text={tab === "mode" ? "Simulation" : tab === "link" ? "Links" : "Joints"} side="bottom" isActive={physicsSubTab === tab} onClick={() => setPhysicsSubTab(tab)} className="h-6 justify-center px-1 text-[10px]" />
            ))}
          </div>

          {physicsSubTab === "mode" && (
            <div className="space-y-2 rounded-md border border-ide-glass-border bg-ide-glass-surface p-2 text-[10px]">
              <p className="text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Rapier simulation mode</p>
              <div className="grid grid-cols-2 gap-1">
                <IdeBarItem tooltip="Pose driven by the jog sliders only" text="Kinematic" side="bottom" isActive={physicsMode === "kinematic"} onClick={() => setPhysicsMode("kinematic")} className="h-6 justify-center px-1 text-[10px]" />
                <IdeBarItem tooltip="A single rigid body using the summed link mass, affected by gravity/collisions" text="Dynamic" side="bottom" isActive={physicsMode === "dynamic"} onClick={() => setPhysicsMode("dynamic")} className="h-6 justify-center px-1 text-[10px]" />
              </div>
              <p className="text-[9px] leading-snug text-[var(--ide-text-inactive)]">Total mass: <span className="font-mono text-[var(--primary)]">{totalMass.toFixed(2)} kg</span>. Dynamic mode is a simplified whole-body stand-in — not per-joint articulated dynamics.</p>
            </div>
          )}

          {physicsSubTab === "link" && (
            <div className="space-y-2 rounded-md border border-ide-glass-border bg-ide-glass-surface p-2 text-[10px]">
              <label className="block text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Link
                <select value={selectedLinkName ?? ""} onChange={(event) => setSelectedKinematicNode({ kind: "link", name: event.target.value })} className="mt-1 h-7 w-full rounded border border-ide-glass-border bg-ide-glass-input px-1 text-[11px] text-[var(--foreground)] outline-none">
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
            <div className="space-y-2 rounded-md border border-ide-glass-border bg-ide-glass-surface p-2 text-[10px]">
              <label className="block text-[9px] uppercase tracking-wider text-[var(--ide-text-inactive)]">Joint
                <select value={selectedJointName ?? ""} onChange={(event) => setSelectedKinematicNode({ kind: "joint", name: event.target.value })} className="mt-1 h-7 w-full rounded border border-ide-glass-border bg-ide-glass-input px-1 text-[11px] text-[var(--foreground)] outline-none">
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
            showTcpFrame={showTcpFrame}
            showCollisionBody={showCollisionBody}
            showVisual={showVisual}
            physicsMode={physicsMode}
            onSelfCollision={setSelfCollision}
            onPhysicsCollision={setPhysicsCollision}
          />
        </Physics>
        {checkMode && loadedOrd && <group
          position={[linearPosition.X / 1000, linearPosition.Y / 1000, linearPosition.Z / 1000]}
          rotation={[(linearPosition.RX * Math.PI) / 180, (linearPosition.RY * Math.PI) / 180, (linearPosition.RZ * Math.PI) / 180, "ZYX"]}
        >
          <ReachEnvelope ord={loadedOrd} tcpOffset={tcpOffset} color={primaryColor} />
        </group>}
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