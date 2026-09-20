import { XMLParser } from "fast-xml-parser";
import { ValidationError } from "../../errors/AppError.js";
import { ORD_VERSION, type OrdDocument, type OrdJoint, type OrdLink } from "./ord.schema.js";
import {
  IDENTITY_TRANSFORM,
  composeTransform,
  deriveDhChain,
  deriveScrewAxis,
  matMulVec,
  transformToDualQuaternion,
  type Transform,
  type Vec3,
} from "./kinematicsMath.js";

const SUPPORTED_JOINT_TYPES = new Set(["revolute", "continuous", "prismatic", "fixed"]);

export interface ResolvedMesh {
  storageKey: string;
  fileType: "stl" | "dae" | "obj" | "gltf" | "glb";
}

export type MeshResolver = (urdfFilename: string) => ResolvedMesh | undefined;

function parseVec3(value: string | undefined): Vec3 {
  if (!value) return [0, 0, 0];
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new ValidationError(`Invalid vec3 value in URDF: "${value}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

interface RawJoint {
  "@_name": string;
  "@_type": string;
  parent: { "@_link": string };
  child: { "@_link": string };
  origin?: { "@_xyz"?: string; "@_rpy"?: string };
  axis?: { "@_xyz"?: string };
  limit?: { "@_lower"?: string; "@_upper"?: string; "@_effort"?: string; "@_velocity"?: string };
  dynamics?: { "@_friction"?: string; "@_damping"?: string };
}

interface RawGeometryHolder {
  geometry?: { mesh?: { "@_filename"?: string } };
}

interface RawLink {
  "@_name": string;
  inertial?: {
    mass?: { "@_value"?: string };
    origin?: { "@_xyz"?: string };
    inertia?: Record<string, string | undefined>;
  };
  visual?: RawGeometryHolder | RawGeometryHolder[];
  collision?: RawGeometryHolder | RawGeometryHolder[];
}

function meshFileType(filename: string): ResolvedMesh["fileType"] | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "stl" || ext === "dae" || ext === "obj" || ext === "gltf" || ext === "glb") return ext;
  return null;
}

/**
 * Derives an .ord document from a URDF file's text content. Meshes referenced
 * by the URDF (`<mesh filename="...">`) are resolved via `resolveMesh`, which
 * the caller wires up to whatever mesh files were uploaded alongside the URDF.
 *
 * Scope: supports a single serial kinematic chain (revolute/continuous/
 * prismatic/fixed joints) — the topology every common industrial arm uses.
 * DH parameters are computed along the longest root-to-leaf chain; branch
 * joints (e.g. a gripper fork) still get a screw axis but no DH parameters.
 */
export function parseUrdfToOrd(xml: string, sourceStorageKey: string, resolveMesh: MeshResolver): OrdDocument {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["link", "joint", "visual", "collision"].includes(name),
  });

  let parsed: { robot?: { link?: RawLink[]; joint?: RawJoint[] } };
  try {
    parsed = parser.parse(xml);
  } catch (err) {
    throw new ValidationError("Malformed URDF XML", { cause: (err as Error).message });
  }

  const robot = parsed.robot;
  if (!robot || !robot.link || robot.link.length === 0) {
    throw new ValidationError("URDF must contain at least one <link>");
  }

  const rawLinks = robot.link;
  const rawJoints = asArray(robot.joint);

  for (const joint of rawJoints) {
    if (!SUPPORTED_JOINT_TYPES.has(joint["@_type"])) {
      throw new ValidationError(
        `Unsupported joint type "${joint["@_type"]}" on joint "${joint["@_name"]}" — only revolute, continuous, prismatic, and fixed are supported`,
      );
    }
  }

  const childLinkNames = new Set(rawJoints.map((j) => j.child["@_link"]));
  const rootLink = rawLinks.find((l) => !childLinkNames.has(l["@_name"]));
  if (!rootLink) {
    throw new ValidationError("Could not determine a root link (every link is some joint's child)");
  }

  const childrenByParent = new Map<string, RawJoint[]>();
  for (const joint of rawJoints) {
    const parentName = joint.parent["@_link"];
    if (!childrenByParent.has(parentName)) childrenByParent.set(parentName, []);
    childrenByParent.get(parentName)!.push(joint);
  }

  const linkTransforms = new Map<string, Transform>([[rootLink["@_name"], IDENTITY_TRANSFORM]]);
  const orderedJoints: { raw: RawJoint; originTransform: Transform }[] = [];

  // BFS from the root so every child's transform is computed exactly once,
  // after its parent's.
  const queue = [rootLink["@_name"]];
  while (queue.length > 0) {
    const parentName = queue.shift()!;
    const parentTransform = linkTransforms.get(parentName)!;
    for (const joint of childrenByParent.get(parentName) ?? []) {
      const xyz = parseVec3(joint.origin?.["@_xyz"]);
      const rpy = parseVec3(joint.origin?.["@_rpy"]);
      const childTransform = composeTransform(parentTransform, xyz, rpy);
      linkTransforms.set(joint.child["@_link"], childTransform);
      orderedJoints.push({ raw: joint, originTransform: childTransform });
      queue.push(joint.child["@_link"]);
    }
  }

  if (orderedJoints.length !== rawJoints.length) {
    throw new ValidationError("URDF kinematic tree is disconnected or contains a cycle");
  }

  // Longest root-to-leaf path gets DH parameters; the rest is branch-only.
  const chainOrder = findLongestChain(rootLink["@_name"], childrenByParent);
  const chainJointNames = new Set(chainOrder.map((j) => j["@_name"]));
  const dhByJointName = new Map(
    chainOrder.length > 0
      ? chainOrder
          .map((joint) => {
            const t = linkTransforms.get(joint.child["@_link"])!;
            const axis = parseVec3(joint.axis?.["@_xyz"] ?? "0 0 1");
            return { name: joint["@_name"], point: t.translation, axis: matMulVec(t.rotation, axis) };
          })
          .map((entry, index, all) => [entry.name, deriveDhChain(all.map((e) => ({ point: e.point, axis: e.axis })))[index]] as const)
      : [],
  );

  const links: OrdLink[] = rawLinks.map((link) => {
    const parentJoint = rawJoints.find((j) => j.child["@_link"] === link["@_name"]);
    const inertial = link.inertial;
    const inertia = inertial?.inertia ?? {};
    return {
      name: link["@_name"],
      parent: parentJoint ? parentJoint.parent["@_link"] : null,
      mass: Number(inertial?.mass?.["@_value"] ?? 0),
      centerOfMass: parseVec3(inertial?.origin?.["@_xyz"]),
      inertia: [
        Number(inertia["@_ixx"] ?? 0),
        Number(inertia["@_iyy"] ?? 0),
        Number(inertia["@_izz"] ?? 0),
        Number(inertia["@_ixy"] ?? 0),
        Number(inertia["@_ixz"] ?? 0),
        Number(inertia["@_iyz"] ?? 0),
      ],
    };
  });

  const joints: OrdJoint[] = orderedJoints.map(({ raw, originTransform }) => {
    const type = raw["@_type"] as OrdJoint["type"];
    const axisLocal = parseVec3(raw.axis?.["@_xyz"] ?? "0 0 1");
    const axisSpaceFrame = matMulVec(originTransform.rotation, axisLocal);

    const screwAxis = deriveScrewAxis(type, axisSpaceFrame, originTransform.translation);
    const dh = chainJointNames.has(raw["@_name"]) ? dhByJointName.get(raw["@_name"]) : undefined;

    return {
      name: raw["@_name"],
      parent: raw.parent["@_link"],
      child: raw.child["@_link"],
      type,
      origin: { xyz: parseVec3(raw.origin?.["@_xyz"]), rpy: parseVec3(raw.origin?.["@_rpy"]) },
      axis: axisLocal,
      limits: raw.limit
        ? {
            lower: raw.limit["@_lower"] !== undefined ? Number(raw.limit["@_lower"]) : undefined,
            upper: raw.limit["@_upper"] !== undefined ? Number(raw.limit["@_upper"]) : undefined,
            velocity: raw.limit["@_velocity"] !== undefined ? Number(raw.limit["@_velocity"]) : undefined,
            effort: raw.limit["@_effort"] !== undefined ? Number(raw.limit["@_effort"]) : undefined,
          }
        : undefined,
      dynamics: raw.dynamics
        ? { friction: Number(raw.dynamics["@_friction"] ?? 0), damping: Number(raw.dynamics["@_damping"] ?? 0) }
        : undefined,
      dh,
      screwAxis,
    };
  });

  const visualMeshes: OrdDocument["meshes"]["visual"] = [];
  const collisionMeshes: OrdDocument["meshes"]["collision"] = [];
  for (const link of rawLinks) {
    for (const visual of asArray(link.visual)) {
      const filename = visual.geometry?.mesh?.["@_filename"];
      if (!filename) continue;
      const resolved = resolveMesh(filename);
      const fileType = meshFileType(filename);
      if (resolved && fileType) visualMeshes.push({ link: link["@_name"], storageKey: resolved.storageKey, fileType });
    }
    for (const collision of asArray(link.collision)) {
      const filename = collision.geometry?.mesh?.["@_filename"];
      if (!filename) continue;
      const resolved = resolveMesh(filename);
      const fileType = meshFileType(filename);
      if (resolved && fileType) collisionMeshes.push({ link: link["@_name"], storageKey: resolved.storageKey, fileType });
    }
  }

  return {
    ordVersion: ORD_VERSION,
    name: (parsed.robot as { "@_name"?: string })?.["@_name"] ?? "imported-robot",
    source: { format: "urdf", storageKey: sourceStorageKey },
    links,
    joints,
    meshes: { visual: visualMeshes, collision: collisionMeshes },
    sensors: [],
    basePose: { dualQuaternion: transformToDualQuaternion(IDENTITY_TRANSFORM) },
  };
}

/** Longest root-to-leaf joint path, by joint count — used as the DH reference chain. */
function findLongestChain(rootLink: string, childrenByParent: Map<string, RawJoint[]>): RawJoint[] {
  function longestFrom(linkName: string): RawJoint[] {
    const children = childrenByParent.get(linkName) ?? [];
    let best: RawJoint[] = [];
    for (const joint of children) {
      const candidate = [joint, ...longestFrom(joint.child["@_link"])];
      if (candidate.length > best.length) best = candidate;
    }
    return best;
  }
  return longestFrom(rootLink);
}
