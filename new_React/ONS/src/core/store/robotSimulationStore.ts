import { create } from "zustand"

export type RobotLayer = "kinematics" | "visual" | "collision" | "simulation"

export interface RobotPose {
  joints: Record<string, number>
  linear: { X: number; Y: number; Z: number; RX: number; RY: number; RZ: number }
  tcp: { X: number; Y: number; Z: number }
}

export interface KinematicLinkDef {
  id: string
  name: string
  type: "base" | "link" | "joint"
  parent?: string
  child?: string
  axis?: string
  limit?: { min: number; max: number }
}

export interface RobotRuntimeLayer {
  id: RobotLayer
  label: string
  visible: boolean
}

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
  kinematicChain: KinematicLinkDef[]
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
  joints: { J1: 0, J2: 0, J3: 0, J4: 0, J5: 0, J6: 0 },
  linear: { X: 0, Y: 0, Z: 0, RX: 0, RY: 0, RZ: 0 },
  tcp: { X: 0, Y: 0, Z: 0 },
}

const initialKinematicChain: KinematicLinkDef[] = [
  { id: "base_link", name: "base_link", type: "base" },
  { id: "shoulder_pan_joint", name: "shoulder_pan_joint", type: "joint", parent: "base_link", child: "shoulder_link", axis: "Z", limit: { min: -180, max: 180 } },
  { id: "shoulder_link", name: "shoulder_link", type: "link", parent: "base_link", child: "upper_arm_link" },
  { id: "shoulder_lift_joint", name: "shoulder_lift_joint", type: "joint", parent: "shoulder_link", child: "upper_arm_link", axis: "Y", limit: { min: -180, max: 180 } },
  { id: "upper_arm_link", name: "upper_arm_link", type: "link", parent: "shoulder_link", child: "forearm_link" },
  { id: "elbow_joint", name: "elbow_joint", type: "joint", parent: "upper_arm_link", child: "forearm_link", axis: "Y", limit: { min: -180, max: 180 } },
  { id: "forearm_link", name: "forearm_link", type: "link", parent: "upper_arm_link", child: "wrist_1_link" },
  { id: "wrist_1_joint", name: "wrist_1_joint", type: "joint", parent: "forearm_link", child: "wrist_1_link", axis: "Y", limit: { min: -180, max: 180 } },
  { id: "wrist_1_link", name: "wrist_1_link", type: "link", parent: "forearm_link", child: "wrist_2_link" },
  { id: "wrist_2_joint", name: "wrist_2_joint", type: "joint", parent: "wrist_1_link", child: "wrist_2_link", axis: "Z", limit: { min: -180, max: 180 } },
  { id: "wrist_2_link", name: "wrist_2_link", type: "link", parent: "wrist_1_link", child: "wrist_3_link" },
  { id: "wrist_3_joint", name: "wrist_3_joint", type: "joint", parent: "wrist_2_link", child: "wrist_3_link", axis: "Y", limit: { min: -180, max: 180 } },
  { id: "wrist_3_link", name: "wrist_3_link", type: "link", parent: "wrist_2_link", child: "tcp" },
]

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
  kinematicChain: initialKinematicChain,
  showVisual: true,
  showCollisionBody: false,
  checkWorkspace: false,
  collision: false,

  setJoint: (joint, value) => set((state) => ({ joints: { ...state.joints, [joint]: value } })),
  setLinear: (axis, value) => set((state) => ({ linear: { ...state.linear, [axis]: value } })),
  setTcp: (axis, value) => set((state) => ({ tcp: { ...state.tcp, [axis]: value } })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  stepSimulation: () => set((state) => ({ simulationTime: state.simulationTime + state.stepSize })),
  resetSimulation: () => set({ ...initialPose, simulationTime: 0, collision: false }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setShowVisual: (showVisual) => set({ showVisual }),
  setShowCollisionBody: (showCollisionBody) => set({ showCollisionBody }),
  setCheckWorkspace: (checkWorkspace) => set({ checkWorkspace }),
  setCollision: (collision) => set({ collision }),
}))
