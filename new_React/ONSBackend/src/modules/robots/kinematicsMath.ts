// Pure vector/matrix math for deriving DH parameters, screw axes, and dual
// quaternions from a URDF-style kinematic chain (joint origins + axes in the
// space/base frame at the zero/home configuration).
//
// Conventions:
// - Rotations use URDF's fixed-axis roll-pitch-yaw: R = Rz(yaw) * Ry(pitch) * Rx(roll).
// - DH parameters use the common-normal construction (Craig, "Introduction to
//   Robotics"), computed pairwise between consecutive joint axis *lines* in
//   the space frame. This assumes a single serial chain (no branching) — the
//   only topology industrial arms like UR5 actually use.
// - Screw axes use the Modern Robotics (Lynch & Park) space-frame convention:
//   S = (omega, v), with v = -omega x q for revolute joints (q = a point on
//   the axis) and v = axis direction for prismatic joints.

export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

const EPS = 1e-9;

export function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vecScale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function norm(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function normalize(a: Vec3): Vec3 {
  const n = norm(a);
  if (n < EPS) return [0, 0, 0];
  return vecScale(a, 1 / n);
}

export function rpyToMatrix([roll, pitch, yaw]: Vec3): Mat3 {
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);

  // R = Rz(yaw) * Ry(pitch) * Rx(roll)
  return [
    [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
    [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
    [-sp, cp * sr, cp * cr],
  ];
}

export function matMulVec(m: Mat3, v: Vec3): Vec3 {
  return [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
}

export function matMulMat(a: Mat3, b: Mat3): Mat3 {
  const bt: Mat3 = [
    [b[0][0], b[1][0], b[2][0]],
    [b[0][1], b[1][1], b[2][1]],
    [b[0][2], b[1][2], b[2][2]],
  ];
  const row = (r: Vec3): Vec3 => [dot(r, bt[0]), dot(r, bt[1]), dot(r, bt[2])];
  return [row(a[0]), row(a[1]), row(a[2])];
}

export interface Transform {
  rotation: Mat3;
  translation: Vec3;
}

export const IDENTITY_TRANSFORM: Transform = {
  rotation: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  translation: [0, 0, 0],
};

/** Compose a child transform (relative to parent) into the space/base frame. */
export function composeTransform(parent: Transform, originXyz: Vec3, originRpy: Vec3): Transform {
  const localRotation = rpyToMatrix(originRpy);
  return {
    rotation: matMulMat(parent.rotation, localRotation),
    translation: vecAdd(parent.translation, matMulVec(parent.rotation, originXyz)),
  };
}

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

export function matrixToQuaternion(m: Mat3): Quaternion {
  const trace = m[0][0] + m[1][1] + m[2][2];
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return { w: 0.25 / s, x: (m[2][1] - m[1][2]) * s, y: (m[0][2] - m[2][0]) * s, z: (m[1][0] - m[0][1]) * s };
  }
  if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
    const s = 2 * Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]);
    return { w: (m[2][1] - m[1][2]) / s, x: 0.25 * s, y: (m[0][1] + m[1][0]) / s, z: (m[0][2] + m[2][0]) / s };
  }
  if (m[1][1] > m[2][2]) {
    const s = 2 * Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]);
    return { w: (m[0][2] - m[2][0]) / s, x: (m[0][1] + m[1][0]) / s, y: 0.25 * s, z: (m[1][2] + m[2][1]) / s };
  }
  const s = 2 * Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]);
  return { w: (m[1][0] - m[0][1]) / s, x: (m[0][2] + m[2][0]) / s, y: (m[1][2] + m[2][1]) / s, z: 0.25 * s };
}

export interface DualQuaternion {
  real: [number, number, number, number];
  dual: [number, number, number, number];
}

/** Standard rigid-transform-to-dual-quaternion conversion: dual = 0.5 * [0,t] * real. */
export function transformToDualQuaternion(transform: Transform): DualQuaternion {
  const q = matrixToQuaternion(transform.rotation);
  const [tx, ty, tz] = transform.translation;
  // Quaternion product [0, t] * q, quaternion = (w, x, y, z)
  const tw = -tx * q.x - ty * q.y - tz * q.z;
  const txp = tx * q.w + ty * q.z - tz * q.y;
  const typ = -tx * q.z + ty * q.w + tz * q.x;
  const tzp = tx * q.y - ty * q.x + tz * q.w;

  return {
    real: [q.w, q.x, q.y, q.z],
    dual: [0.5 * tw, 0.5 * txp, 0.5 * typ, 0.5 * tzp],
  };
}

/** Screw axis (space frame) for a revolute/continuous or prismatic joint. */
export function deriveScrewAxis(
  jointType: "revolute" | "continuous" | "prismatic" | "fixed",
  axisSpaceFrame: Vec3,
  pointOnAxis: Vec3,
): { omega: Vec3; v: Vec3 } {
  if (jointType === "prismatic") {
    return { omega: [0, 0, 0], v: normalize(axisSpaceFrame) };
  }
  if (jointType === "fixed") {
    return { omega: [0, 0, 0], v: [0, 0, 0] };
  }
  const omega = normalize(axisSpaceFrame);
  const v = vecScale(cross(omega, pointOnAxis), -1);
  return { omega, v };
}

interface AxisLine {
  point: Vec3;
  axis: Vec3;
}

interface ClosestPoints {
  footOnFirst: Vec3;
  footOnSecond: Vec3;
  parallel: boolean;
}

/** Closest points between two lines given as (point, unit direction). */
function closestPointsBetweenLines(first: AxisLine, second: AxisLine): ClosestPoints {
  const w0 = vecSub(first.point, second.point);
  const b = dot(first.axis, second.axis);
  const d = dot(first.axis, w0);
  const e = dot(second.axis, w0);
  const denom = 1 - b * b;

  if (Math.abs(denom) < EPS) {
    // Parallel axes: perpendicular offset is well-defined even though the
    // "closest point" pairing along the lines is not.
    const perpOffset = vecSub(w0, vecScale(first.axis, d));
    return {
      footOnFirst: first.point,
      footOnSecond: vecAdd(first.point, vecScale(perpOffset, -1)),
      parallel: true,
    };
  }

  const t1 = (b * e - d) / denom;
  const t2 = (e - b * d) / denom;
  return {
    footOnFirst: vecAdd(first.point, vecScale(first.axis, t1)),
    footOnSecond: vecAdd(second.point, vecScale(second.axis, t2)),
    parallel: false,
  };
}

/** A unit vector perpendicular to `axis`, used when a common normal is undefined. */
function anyPerpendicular(axis: Vec3): Vec3 {
  const reference: Vec3 = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  return normalize(cross(axis, reference));
}

export interface DhParams {
  a: number;
  alpha: number;
  d: number;
  thetaOffset: number;
}

/**
 * Derive DH parameters for a serial chain of joints (Craig's common-normal
 * construction). `chain[i]` is the i-th joint's axis line in the space frame
 * at the home configuration. The virtual "joint -1" is the world frame
 * (z = +Z, origin at the world origin), matching the usual convention that
 * DH frame 0 is referenced to the base frame.
 */
export function deriveDhChain(chain: AxisLine[]): DhParams[] {
  if (chain.length === 0) return [];

  const worldAxis: AxisLine = { point: [0, 0, 0], axis: [0, 0, 1] };
  const results: DhParams[] = [];

  // x[k] = common-normal direction between joint k and joint k+1 (or the
  // fallback perpendicular for the last joint, which has no "next" axis).
  const commonNormalX: Vec3[] = [];
  const footOnCurrentFromPrev: Vec3[] = []; // closest point on axis k to axis k-1
  const footOnCurrentFromNext: Vec3[] = []; // closest point on axis k to axis k+1
  const alphaPrev: number[] = [];
  const aPrev: number[] = [];

  for (let k = 0; k < chain.length; k++) {
    const prev = k === 0 ? worldAxis : chain[k - 1];
    const current = chain[k];
    const { footOnFirst, footOnSecond, parallel } = closestPointsBetweenLines(prev, current);

    // The common-normal direction is intrinsic to the two axis directions
    // (cross product), not to where the feet land — using the feet difference
    // degenerates to the zero vector whenever the axes intersect (a = 0).
    let xPrev = parallel ? [0, 0, 0] as Vec3 : normalize(cross(prev.axis, current.axis));
    if (norm(xPrev) < EPS) {
      const perpOffsetDirection = normalize(vecSub(footOnSecond, footOnFirst));
      xPrev = norm(perpOffsetDirection) >= EPS ? perpOffsetDirection : anyPerpendicular(current.axis);
    }

    const sinAlpha = dot(cross(prev.axis, current.axis), xPrev);
    const cosAlpha = dot(prev.axis, current.axis);
    alphaPrev.push(Math.atan2(sinAlpha, cosAlpha));
    aPrev.push(norm(vecSub(footOnSecond, footOnFirst)));
    footOnCurrentFromPrev.push(footOnSecond);
    commonNormalX.push(xPrev);
  }

  for (let k = 0; k < chain.length; k++) {
    const current = chain[k];
    if (k < chain.length - 1) {
      const { footOnFirst } = closestPointsBetweenLines(current, chain[k + 1]);
      footOnCurrentFromNext.push(footOnFirst);
    } else {
      // Last joint: no forward axis, so there's no twist contributed here —
      // reuse the previous common normal and this joint's own origin.
      commonNormalX.push(commonNormalX[k]);
      footOnCurrentFromNext.push(current.point);
    }
  }

  for (let k = 0; k < chain.length; k++) {
    const current = chain[k];
    const xThis = k < chain.length - 1 ? commonNormalX[k + 1] : commonNormalX[k];
    const xPrevForTheta = commonNormalX[k];

    const sinTheta = dot(cross(xPrevForTheta, xThis), current.axis);
    const cosTheta = dot(xPrevForTheta, xThis);
    const thetaOffset = Math.atan2(sinTheta, cosTheta);

    const d = dot(vecSub(footOnCurrentFromNext[k], footOnCurrentFromPrev[k]), current.axis);

    results.push({ a: aPrev[k], alpha: alphaPrev[k], d, thetaOffset });
  }

  return results;
}
