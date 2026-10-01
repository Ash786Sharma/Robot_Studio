import { create } from "zustand"
import type { OrdDocument, OrdJoint, OrdLink } from "@/core/api/robotOrdApi"

export type RobotLayer = "kinematics" | "visual" | "collision" | "simulation"

export interface RobotPose {
  joints: Record<string, number>
  linear: { X: number; Y: number; Z: number; RX: number; RY: number; RZ: number }
  tcp: { X: number; Y: number; Z: number }
}

export interface RobotRuntimeLayer {
  id: RobotLayer
  label: string
  visible: boolean
}

/** The explorer's currently-selected Kinematic Chain node, so the 3D viewer can highlight it. */
export interface SelectedKinematicNode {
  kind: "link" | "joint"
  name: string
}

/** Whole-robot Rapier simulation mode — "dynamic" lets gravity/mass actually act on the robot (a simplified,
 *  single-rigid-body stand-in for true per-joint articulated dynamics, which this doesn't attempt). */
export type PhysicsMode = "kinematic" | "dynamic"

interface RobotSimulationState extends RobotPose {
  isPlaying: boolean
  simulationTime: number
  stepSize: number
  activeLayer: RobotLayer
  layers: RobotRuntimeLayer[]
  showVisual: boolean
  showCollisionBody: boolean
  checkWorkspace: boolean
  collision: boolean
  /** The robot device's live .ord document — the single source of truth for links/joints/mass/inertia/limits. */
  loadedOrd: OrdDocument | null
  physicsMode: PhysicsMode
  selectedKinematicNode: SelectedKinematicNode | null
  setSelectedKinematicNode: (node: SelectedKinematicNode | null) => void
  setLoadedOrd: (ord: OrdDocument) => void
  updateLinkProperties: (linkName: string, patch: Partial<Pick<OrdLink, "mass" | "centerOfMass" | "inertia">>) => void
  updateJointProperties: (jointName: string, patch: Partial<Pick<OrdJoint, "limits" | "dynamics">>) => void
  setPhysicsMode: (mode: PhysicsMode) => void
  setJoint: (joint: string, value: number) => void
  setLinear: (axis: keyof RobotPose["linear"], value: number) => void
  setTcp: (axis: keyof RobotPose["tcp"], value: number) => void
  setPlaying: (playing: boolean) => void
  stepSimulation: () => void
  resetSimulation: () => void
  setActiveLayer: (layer: RobotLayer) => void
  setShowVisual: (show: boolean) => void
  setShowCollisionBody: (show: boolean) => void
  setCheckWorkspace: (show: boolean) => void
  setCollision: (collision: boolean) => void
}

const initialPose: RobotPose = {
  joints: {},
  linear: { X: 0, Y: 0, Z: 0, RX: 0, RY: 0, RZ: 0 },
  tcp: { X: 0, Y: 0, Z: 0 },
}

const initialLayers: RobotRuntimeLayer[] = [
  { id: "kinematics", label: "Kinematic Chain", visible: true },
  { id: "visual", label: "Visual Model", visible: true },
  { id: "collision", label: "Collision Model", visible: false },
  { id: "simulation", label: "Simulation", visible: true },
]

export const useRobotSimulationStore = create<RobotSimulationState>((set) => ({
  ...initialPose,
  isPlaying: false,
  simulationTime: 0,
  stepSize: 0.01,
  activeLayer: "kinematics",
  layers: initialLayers,
  loadedOrd: null,
  physicsMode: "kinematic",
  selectedKinematicNode: null,
  showVisual: true,
  showCollisionBody: false,
  checkWorkspace: false,
  collision: false,

  setSelectedKinematicNode: (selectedKinematicNode) => set({ selectedKinematicNode }),
  setLoadedOrd: (ord) => set((state) => {
    // Preserve whatever pose is already dialed in across re-fetches — only seed joints we don't have yet.
    const joints = { ...state.joints }
    for (const joint of ord.joints) {
      if (joint.type !== "fixed" && !(joint.name in joints)) joints[joint.name] = 0
    }
    return { loadedOrd: ord, joints }
  }),
  updateLinkProperties: (linkName, patch) => set((state) => {
    if (!state.loadedOrd) return state
    return {
      loadedOrd: {
        ...state.loadedOrd,
        links: state.loadedOrd.links.map((link) => (link.name === linkName ? { ...link, ...patch } : link)),
      },
    }
  }),
  updateJointProperties: (jointName, patch) => set((state) => {
    if (!state.loadedOrd) return state
    return {
      loadedOrd: {
        ...state.loadedOrd,
        joints: state.loadedOrd.joints.map((joint) => (joint.name === jointName ? { ...joint, ...patch } : joint)),
      },
    }
  }),
  setPhysicsMode: (physicsMode) => set({ physicsMode }),
  setJoint: (joint, value) => set((state) => ({ joints: { ...state.joints, [joint]: value } })),
  setLinear: (axis, value) => set((state) => ({ linear: { ...state.linear, [axis]: value } })),
  setTcp: (axis, value) => set((state) => ({ tcp: { ...state.tcp, [axis]: value } })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  stepSimulation: () => set((state) => ({ simulationTime: state.simulationTime + state.stepSize })),
  resetSimulation: () => set((state) => ({ ...initialPose, joints: Object.fromEntries(Object.keys(state.joints).map((name) => [name, 0])), simulationTime: 0, collision: false })),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setShowVisual: (showVisual) => set({ showVisual }),
  setShowCollisionBody: (showCollisionBody) => set({ showCollisionBody }),
  setCheckWorkspace: (checkWorkspace) => set({ checkWorkspace }),
  setCollision: (collision) => set({ collision }),
}))
