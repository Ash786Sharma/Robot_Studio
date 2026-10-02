import { Box3, Euler, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from "three"
import { MeshBVH } from "three-mesh-bvh"
import type { OrdDocument } from "@/core/api/robotOrdApi"
import type { OrdRobotGroups } from "@/features/simulation/lib/buildOrdRobot"

interface LinkCollider {
  name: string
  meshes: Mesh[]
}

export interface RobotCollisionModel {
  links: LinkCollider[]
  rootLinkName: string | undefined
  /** "a|b" pairs never tested: parent/child neighbours plus pairs already touching in the zero pose (MoveIt-style "default" disables). */
  ignoredPairs: Set<string>
}

export interface CollisionResult {
  selfPairs: Array<[string, string]>
  groundLinks: string[]
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

const boxA = new Box3()
const boxB = new Box3()
const bToA = new Matrix4()
const vertex = new Vector3()

function worldBox(mesh: Mesh, target: Box3) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  return target.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld)
}

function meshesIntersect(a: Mesh, b: Mesh) {
  if (!worldBox(a, boxA).intersectsBox(worldBox(b, boxB))) return false
  bToA.copy(a.matrixWorld).invert().multiply(b.matrixWorld)
  return (a.geometry.boundsTree as MeshBVH).intersectsGeometry(b.geometry, bToA)
}

function linksIntersect(a: LinkCollider, b: LinkCollider) {
  return a.meshes.some((meshA) => b.meshes.some((meshB) => meshesIntersect(meshA, meshB)))
}

function penetratesGround(mesh: Mesh, groundZ: number) {
  if (worldBox(mesh, boxA).min.z >= groundZ) return false
  const position = mesh.geometry.getAttribute("position")
  for (let index = 0; index < position.count; index += 1) {
    if (vertex.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld).z < groundZ) return true
  }
  return false
}

/** Must be called while `groups` is still in its zero pose (before any joint values are applied). */
export function createRobotCollisionModel(groups: OrdRobotGroups, ord: OrdDocument): RobotCollisionModel {
  const links: LinkCollider[] = ord.links.map((link) => {
    const meshes: Mesh[] = []
    for (const object of groups.linkMeshes.get(link.name) ?? []) {
      object.traverse((child: Object3D) => {
        const mesh = child as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.boundsTree ??= new MeshBVH(mesh.geometry)
        meshes.push(mesh)
      })
    }
    return { name: link.name, meshes }
  }).filter((link) => link.meshes.length > 0)

  const ignoredPairs = new Set(ord.joints.map((joint) => pairKey(joint.parent, joint.child)))
  groups.root.updateWorldMatrix(true, true)
  for (let i = 0; i < links.length; i += 1) {
    for (let j = i + 1; j < links.length; j += 1) {
      const key = pairKey(links[i].name, links[j].name)
      if (!ignoredPairs.has(key) && linksIntersect(links[i], links[j])) ignoredPairs.add(key)
    }
  }

  return { links, rootLinkName: ord.links.find((link) => link.parent === null)?.name, ignoredPairs }
}

/** Exact triangle-level test of the model's current pose: link-vs-link, and every non-root link against the ground plane. */
export function checkRobotCollisions(model: RobotCollisionModel, root: Object3D, groundZ = 0): CollisionResult {
  root.updateWorldMatrix(true, true)
  const selfPairs: Array<[string, string]> = []
  for (let i = 0; i < model.links.length; i += 1) {
    for (let j = i + 1; j < model.links.length; j += 1) {
      const a = model.links[i]
      const b = model.links[j]
      if (!model.ignoredPairs.has(pairKey(a.name, b.name)) && linksIntersect(a, b)) selfPairs.push([a.name, b.name])
    }
  }
  const groundLinks = model.links
    .filter((link) => link.name !== model.rootLinkName && link.meshes.some((mesh) => penetratesGround(mesh, groundZ)))
    .map((link) => link.name)
  return { selfPairs, groundLinks }
}

export interface LinkHullCollider {
  name: string
  vertices: Float32Array
  position: [number, number, number]
  rotation: [number, number, number]
  /** Uniform display scale baked into `vertices` — mass properties must be scaled the same way. */
  scale: number
}

const MAX_HULL_POINTS = 1500
const linkPointCache = new WeakMap<LinkCollider, Float32Array>()
const relative = new Matrix4()
const decomposedPosition = new Vector3()
const decomposedQuaternion = new Quaternion()
const decomposedScale = new Vector3()
const euler = new Euler()

/** Transform from `node`'s frame into `ancestor`'s frame (or the top of the tree when `ancestor` is null). */
function relativeMatrix(node: Object3D, ancestor: Object3D | null, target: Matrix4) {
  target.identity()
  for (let current: Object3D | null = node; current && current !== ancestor; current = current.parent) target.premultiply(current.matrix)
  return target
}

/** Deduped, subsampled vertices of a link's meshes in that link's own frame — the convex hull input. */
function linkLocalPoints(link: LinkCollider, linkGroup: Object3D) {
  const cached = linkPointCache.get(link)
  if (cached) return cached
  const seen = new Set<string>()
  const points: number[] = []
  for (const mesh of link.meshes) {
    relativeMatrix(mesh, linkGroup, relative)
    const position = mesh.geometry.getAttribute("position")
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index).applyMatrix4(relative)
      const key = `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`
      if (seen.has(key)) continue
      seen.add(key)
      points.push(vertex.x, vertex.y, vertex.z)
    }
  }
  const stride = Math.max(1, Math.ceil(points.length / 3 / MAX_HULL_POINTS))
  const sampled = new Float32Array(Math.ceil(points.length / 3 / stride) * 3)
  for (let source = 0, target = 0; source < points.length; source += stride * 3, target += 3) {
    sampled[target] = points[source]
    sampled[target + 1] = points[source + 1]
    sampled[target + 2] = points[source + 2]
  }
  linkPointCache.set(link, sampled)
  return sampled
}

/** One convex hull per link, posed relative to the robot root's parent (the rigid body's frame) for the current joint values. */
export function computeLinkHullColliders(model: RobotCollisionModel, groups: OrdRobotGroups): LinkHullCollider[] {
  groups.root.updateMatrixWorld(true)
  return model.links.flatMap((link) => {
    const linkGroup = groups.linkGroups.get(link.name)
    if (!linkGroup) return []
    const local = linkLocalPoints(link, linkGroup)
    relativeMatrix(linkGroup, groups.root.parent, relative).decompose(decomposedPosition, decomposedQuaternion, decomposedScale)
    // Robot display scale is uniform, so baking it into the points keeps the hull exact.
    const vertices = local.map((value) => value * decomposedScale.x)
    euler.setFromQuaternion(decomposedQuaternion)
    return [{
      name: link.name,
      vertices,
      position: decomposedPosition.toArray() as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      scale: decomposedScale.x,
    }]
  })
}

export interface ColliderMassProperties {
  mass: number
  centerOfMass: { x: number; y: number; z: number }
  principalAngularInertia: { x: number; y: number; z: number }
  angularInertiaLocalFrame: { x: number; y: number; z: number; w: number }
}

/** Eigen-decomposition of a symmetric 3x3 matrix (cyclic Jacobi). Returns eigenvalues and column eigenvectors. */
function symmetricEigen3(matrix: number[][]) {
  const a = matrix.map((row) => [...row])
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  for (let sweep = 0; sweep < 50; sweep += 1) {
    if (Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]) < 1e-15) break
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-18) continue
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
      const c = 1 / Math.sqrt(t * t + 1)
      const s = t * c
      for (let k = 0; k < 3; k += 1) {
        const akp = a[k][p]
        const akq = a[k][q]
        a[k][p] = c * akp - s * akq
        a[k][q] = s * akp + c * akq
      }
      for (let k = 0; k < 3; k += 1) {
        const apk = a[p][k]
        const aqk = a[q][k]
        a[p][k] = c * apk - s * aqk
        a[q][k] = s * apk + c * aqk
      }
      for (let k = 0; k < 3; k += 1) {
        const vkp = v[k][p]
        const vkq = v[k][q]
        v[k][p] = c * vkp - s * vkq
        v[k][q] = s * vkp + c * vkq
      }
    }
  }
  return { values: [a[0][0], a[1][1], a[2][2]], vectors: v }
}

/**
 * Rapier mass properties from an .ord link (`inertia` = [ixx, iyy, izz, ixy, ixz, iyz] about the COM, link-frame axes).
 * Returns undefined when the link has no usable inertia, so the caller can fall back to shape-derived inertia.
 */
export function linkMassProperties(
  link: { mass: number; centerOfMass: [number, number, number]; inertia: [number, number, number, number, number, number] },
  scale: number,
): ColliderMassProperties | undefined {
  const [ixx, iyy, izz, ixy, ixz, iyz] = link.inertia
  if (link.mass <= 0 || ixx <= 0 || iyy <= 0 || izz <= 0) return undefined
  // Lengths are scaled for display, so inertia (mass · length²) scales by scale².
  const s2 = scale * scale
  const { values, vectors } = symmetricEigen3([[ixx, ixy, ixz], [ixy, iyy, iyz], [ixz, iyz, izz]])
  const basis = new Matrix4().set(
    vectors[0][0], vectors[0][1], vectors[0][2], 0,
    vectors[1][0], vectors[1][1], vectors[1][2], 0,
    vectors[2][0], vectors[2][1], vectors[2][2], 0,
    0, 0, 0, 1,
  )
  if (basis.determinant() < 0) {
    basis.elements[8] *= -1
    basis.elements[9] *= -1
    basis.elements[10] *= -1
  }
  const frame = new Quaternion().setFromRotationMatrix(basis)
  return {
    mass: link.mass,
    centerOfMass: { x: link.centerOfMass[0] * scale, y: link.centerOfMass[1] * scale, z: link.centerOfMass[2] * scale },
    principalAngularInertia: { x: Math.max(values[0], 1e-9) * s2, y: Math.max(values[1], 1e-9) * s2, z: Math.max(values[2], 1e-9) * s2 },
    angularInertiaLocalFrame: { x: frame.x, y: frame.y, z: frame.z, w: frame.w },
  }
}
