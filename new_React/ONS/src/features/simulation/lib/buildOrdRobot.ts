import { Euler, Group, Mesh, Object3D, Vector3 } from "three"
import type { OrdDocument } from "@/core/api/robotOrdApi"

export interface OrdRobotGroups {
  /** Root link's group (attach this to the scene). */
  root: Group
  /** Per-link group, named after the link — meshes for that link live inside it. */
  linkGroups: Map<string, Group>
  /** Mesh objects owned by each link (excludes downstream links, unlike traversing `linkGroups`). */
  linkMeshes: Map<string, Object3D[]>
  /** Per-joint group holding the joint's static origin transform; the live revolute/prismatic motion is applied to `jointAxisGroups`, its child. */
  jointOriginGroups: Map<string, Group>
  /** Per-joint group that gets the live joint-angle rotation/translation applied every update, about `joint.axis`. */
  jointAxisGroups: Map<string, Group>
  /** The link that's nobody's parent — the end of the chain (tool flange / TCP), same idea as the explorer's "kinematic tcp link". */
  tcpLinkName: string | undefined
}

/**
 * Builds a real three.js scene graph straight from an .ord document (not from URDF/XML) —
 * one Group per link/joint, nested exactly like the kinematic tree, so parent transforms
 * compose correctly and link/joint names stay queryable for highlighting + the joint marker.
 */
export function buildOrdRobotGroups(
  ord: OrdDocument,
  meshesForLink: (linkName: string) => Object3D[],
): OrdRobotGroups {
  const linkGroups = new Map<string, Group>()
  const linkMeshes = new Map<string, Object3D[]>()
  const jointOriginGroups = new Map<string, Group>()
  const jointAxisGroups = new Map<string, Group>()

  const childJointsByParentLink = new Map<string, OrdDocument["joints"]>()
  for (const joint of ord.joints) {
    if (!childJointsByParentLink.has(joint.parent)) childJointsByParentLink.set(joint.parent, [])
    childJointsByParentLink.get(joint.parent)!.push(joint)
  }

  const rootLink = ord.links.find((link) => link.parent === null)
  const childLinkNames = new Set(ord.joints.map((joint) => joint.child))
  const tcpLinkName = ord.links.find((link) => !childJointsByParentLink.has(link.name))?.name

  function buildLink(linkName: string): Group {
    const group = new Group()
    group.name = linkName
    const meshes = meshesForLink(linkName)
    for (const mesh of meshes) group.add(mesh)
    linkGroups.set(linkName, group)
    linkMeshes.set(linkName, meshes)

    for (const joint of childJointsByParentLink.get(linkName) ?? []) {
      const originGroup = new Group()
      originGroup.name = `${joint.name}:origin`
      originGroup.position.set(...joint.origin.xyz)
      // URDF's rpy is R = Rz(yaw)*Ry(pitch)*Rx(roll) — three.js's matching Euler order is 'ZYX', not 'XYZ'
      // (verified against urdf-loader's own source, which renders the same .ord-derived URDF correctly).
      originGroup.rotation.copy(new Euler(...joint.origin.rpy, "ZYX"))

      const axisGroup = new Group()
      axisGroup.name = joint.name

      originGroup.add(axisGroup)
      group.add(originGroup)
      jointOriginGroups.set(joint.name, originGroup)
      jointAxisGroups.set(joint.name, axisGroup)

      axisGroup.add(buildLink(joint.child))
    }

    return group
  }

  const root = rootLink ? buildLink(rootLink.name) : new Group()
  void childLinkNames
  return { root, linkGroups, linkMeshes, jointOriginGroups, jointAxisGroups, tcpLinkName }
}

/** Applies a live joint value (radians for revolute/continuous, meters for prismatic) to its axis group. */
export function applyJointValue(groups: OrdRobotGroups, ord: OrdDocument, jointName: string, value: number) {
  const joint = ord.joints.find((entry) => entry.name === jointName)
  const axisGroup = groups.jointAxisGroups.get(jointName)
  if (!joint || !axisGroup) return

  const axis = new Vector3(...joint.axis).normalize()
  if (joint.type === "prismatic") {
    axisGroup.position.copy(axis.clone().multiplyScalar(value))
  } else {
    axisGroup.quaternion.setFromAxisAngle(axis, value)
  }
}

const halton = (index: number, base: number) => {
  let result = 0
  let denominator = 1
  while (index > 0) {
    denominator *= base
    result += (index % base) / denominator
    index = Math.floor(index / base)
  }
  return result
}

/** Samples joint-limited TCP positions in the robot's base frame; this does not exclude collisions. */
export function sampleTcpReach(ord: OrdDocument, tcpOffset: [number, number, number], scale: number, count = 2400): Float32Array {
  const groups = buildOrdRobotGroups(ord, () => [])
  const tcp = groups.tcpLinkName ? groups.linkGroups.get(groups.tcpLinkName) : undefined
  if (!tcp) return new Float32Array()
  groups.root.scale.setScalar(scale)
  const joints = ord.joints.filter((joint) => joint.type !== "fixed")
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
  const positions = new Float32Array(count * 3)
  for (let sample = 0; sample < count; sample += 1) {
    joints.forEach((joint, axis) => {
      const lower = joint.limits?.lower != null && Number.isFinite(joint.limits.lower) ? joint.limits.lower : joint.type === "prismatic" ? -0.5 : -Math.PI
      const upper = joint.limits?.upper != null && Number.isFinite(joint.limits.upper) ? joint.limits.upper : joint.type === "prismatic" ? 0.5 : Math.PI
      const fraction = sample === 0 ? 0.5 : halton(sample, primes[axis % primes.length])
      applyJointValue(groups, ord, joint.name, lower + fraction * (upper - lower))
    })
    groups.root.updateMatrixWorld(true)
    const position = tcp.localToWorld(new Vector3(...tcpOffset))
    positions.set(position.toArray(), sample * 3)
  }
  return positions
}

/** Recursively tags every Mesh under `root` (used to scope the highlight/collision material tweaks to one link). */
export function forEachMesh(root: Object3D, visit: (mesh: Mesh) => void) {
  root.traverse((child) => {
    if ((child as Mesh).isMesh) visit(child as Mesh)
  })
}
