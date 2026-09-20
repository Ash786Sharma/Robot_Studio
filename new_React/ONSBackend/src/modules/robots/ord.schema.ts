import { z } from "zod";

// ONS Robot Description (.ord) — a JSON document that wraps a URDF/SDF import
// (kept as a real file for portability) with the derived data our own
// simulation (Rapier physics), kinematics, and controller code actually need:
// DH parameters, screw axes, and a dual-quaternion base pose. Field names are
// ours, not USD/SDF-compatible — we borrowed ideas from those formats without
// binding to their schemas (see docs/ARCHITECTURE.md discussion).
export const ORD_VERSION = 1;

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

const jointLimitsSchema = z.object({
  lower: z.number().optional(),
  upper: z.number().optional(),
  velocity: z.number().optional(),
  effort: z.number().optional(),
});

const dhParamsSchema = z.object({
  a: z.number(),
  alpha: z.number(),
  d: z.number(),
  thetaOffset: z.number(),
});

const screwAxisSchema = z.object({
  // Unit rotation axis in the space (base) frame at the home configuration.
  // Zero vector for prismatic joints.
  omega: vec3Schema,
  // Linear velocity component of the screw axis (Lynch & Park convention).
  v: vec3Schema,
});

const dualQuaternionSchema = z.object({
  real: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  dual: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

const jointDynamicsSchema = z.object({
  friction: z.number().default(0),
  damping: z.number().default(0),
});

const meshRefSchema = z.object({
  link: z.string(),
  storageKey: z.string(),
  fileType: z.enum(["stl", "dae", "obj", "gltf", "glb"]),
});

const linkSchema = z.object({
  name: z.string(),
  parent: z.string().nullable(),
  mass: z.number().nonnegative().default(0),
  centerOfMass: vec3Schema.default([0, 0, 0]),
  // Inertia tensor diagonal + off-diagonal terms (ixx, iyy, izz, ixy, ixz, iyz).
  inertia: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]).default([0, 0, 0, 0, 0, 0]),
});

const jointSchema = z.object({
  name: z.string(),
  parent: z.string(),
  child: z.string(),
  type: z.enum(["revolute", "continuous", "prismatic", "fixed"]),
  origin: z.object({
    xyz: vec3Schema,
    rpy: vec3Schema,
  }),
  axis: vec3Schema,
  limits: jointLimitsSchema.optional(),
  dynamics: jointDynamicsSchema.optional(),
  dh: dhParamsSchema.optional(),
  screwAxis: screwAxisSchema.optional(),
});

const sensorSchema = z.object({
  name: z.string(),
  kind: z.enum(["camera", "lidar", "force-torque", "imu"]),
  mountLink: z.string(),
  origin: z.object({ xyz: vec3Schema, rpy: vec3Schema }),
});

export const ordSchema = z.object({
  ordVersion: z.literal(ORD_VERSION),
  name: z.string().min(1).max(200),
  // The original imported file, kept as-is for portability/re-export.
  source: z.object({
    format: z.enum(["urdf", "sdf", "ord"]),
    storageKey: z.string(),
  }),
  links: z.array(linkSchema).min(1),
  joints: z.array(jointSchema),
  meshes: z.object({
    visual: z.array(meshRefSchema).default([]),
    collision: z.array(meshRefSchema).default([]),
  }),
  sensors: z.array(sensorSchema).default([]),
  basePose: z.object({
    dualQuaternion: dualQuaternionSchema,
  }),
});

export type OrdDocument = z.infer<typeof ordSchema>;
export type OrdJoint = z.infer<typeof jointSchema>;
export type OrdLink = z.infer<typeof linkSchema>;
