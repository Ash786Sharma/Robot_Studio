import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import type { OrdDocument, OrdJoint } from "@/core/api/robotOrdApi"

const HALTON_BASES = [2, 3, 5, 7, 11, 13, 17, 19]
const originPosition = new Vector3()
const originRotation = new Quaternion()
const jointAxis = new Vector3()
const motionRotation = new Quaternion()

function halton(index: number, base: number) {
  let fraction = 1
  let value = 0
  while (index > 0) {
    fraction /= base
    value += fraction * (index % base)
    index = Math.floor(index / base)
  }
  return value
}

function jointRange(joint: OrdJoint): [number, number] {
  if (joint.type === "fixed") return [0, 0]
  const fallback = joint.type === "prismatic" ? 1 : Math.PI
  return [joint.limits?.lower ?? -fallback, joint.limits?.upper ?? fallback]
}

function jointTransform(joint: OrdJoint, value: number, target: Matrix4) {
  originPosition.set(...joint.origin.xyz)
  originRotation.setFromEuler(new Euler(...joint.origin.rpy, "ZYX"))
  target.compose(originPosition, originRotation, new Vector3(1, 1, 1))

  if (joint.type === "fixed") return target
  jointAxis.set(...joint.axis).normalize()
  if (joint.type === "prismatic") {
    target.multiply(new Matrix4().makeTranslation(jointAxis.x * value, jointAxis.y * value, jointAxis.z * value))
  } else {
    motionRotation.setFromAxisAngle(jointAxis, value)
    target.multiply(new Matrix4().makeRotationFromQuaternion(motionRotation))
  }
  return target
}

/** Deterministic low-discrepancy TCP positions over the .ord joint limits, in robot-base meters. */
export function sampleTcpReachability(ord: OrdDocument, tcpOffset: [number, number, number] = [0, 0, 0], sampleCount = 6000) {
  const root = ord.links.find((link) => link.parent === null)
  if (!root || sampleCount <= 0) return new Float32Array()

  const children = new Map<string, OrdJoint[]>()
  for (const joint of ord.joints) {
    if (!children.has(joint.parent)) children.set(joint.parent, [])
    children.get(joint.parent)!.push(joint)
  }
  const movingJoints = ord.joints.filter((joint) => joint.type !== "fixed")
  const ranges = movingJoints.map(jointRange)
  const tipName = ord.links.find((link) => !children.has(link.name))?.name ?? root.name
  const tipOffset = new Vector3(...tcpOffset)
  const points = new Float32Array(sampleCount * 3)
  const origin = new Matrix4()
  const tip = new Vector3()

  for (let sample = 1; sample <= sampleCount; sample += 1) {
    const values = new Map<string, number>()
    movingJoints.forEach((joint, index) => {
      const [lower, upper] = ranges[index]
      const unit = halton(sample, HALTON_BASES[index % HALTON_BASES.length])
      values.set(joint.name, lower + (upper - lower) * unit)
    })

    const visit = (linkName: string, parentWorld: Matrix4): Matrix4 | undefined => {
      if (linkName === tipName) return parentWorld
      for (const joint of children.get(linkName) ?? []) {
        const jointWorld = parentWorld.clone().multiply(jointTransform(joint, values.get(joint.name) ?? 0, origin))
        const result = visit(joint.child, jointWorld)
        if (result) return result
      }
      return undefined
    }

    const tipWorld = visit(root.name, new Matrix4())
    if (!tipWorld) continue
    tip.copy(tipOffset).applyMatrix4(tipWorld)
    const offset = (sample - 1) * 3
    points[offset] = tip.x
    points[offset + 1] = tip.y
    points[offset + 2] = tip.z
  }
  return points
}
