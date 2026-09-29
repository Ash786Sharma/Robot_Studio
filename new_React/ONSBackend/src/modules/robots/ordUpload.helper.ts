import { localStorage } from "../../storageLib/localStorage.provider.js";
import { ValidationError } from "../../errors/AppError.js";
import { ordSchema, type OrdDocument } from "./ord.schema.js";
import { parseUrdfToOrd, type ResolvedMesh } from "./urdfImport.service.js";

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
}

export interface OrdUploadFiles {
  /** A ready-made .ord JSON file, uploaded as-is. */
  ordFile?: UploadedFile;
  /** A URDF file to derive an .ord document from. */
  urdfFile?: UploadedFile;
  /** Visual mesh files referenced by `urdfFile`'s <visual> tags. */
  meshFiles?: UploadedFile[];
  /**
   * Collision mesh files referenced by `urdfFile`'s <collision> tags. Kept as
   * a separate upload field for clarity (robots often use lower-poly meshes
   * here), but resolved into the same by-filename lookup as `meshFiles` —
   * which array a mesh ends up in (`ord.meshes.visual` vs `.collision`) is
   * decided by which URDF tag references its filename, not which field it
   * was uploaded under.
   */
  collisionMeshFiles?: UploadedFile[];
}

const MESH_EXTENSIONS = new Set(["stl", "dae", "obj", "gltf", "glb"]);

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Writes an uploaded robot description bundle (either a ready `.ord`, or a
 * URDF + meshes to derive one from) under `storagePrefix`, and returns the
 * resulting .ord document. Shared by the robot library and per-project
 * device creation, which only differ in where they persist the result.
 */
export async function resolveOrdFromUpload(storagePrefix: string, files: OrdUploadFiles): Promise<OrdDocument> {
  if (files.ordFile) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(files.ordFile.buffer.toString("utf-8"));
    } catch {
      throw new ValidationError("Uploaded .ord file is not valid JSON");
    }
    const result = ordSchema.safeParse(parsedJson);
    if (!result.success) {
      throw new ValidationError("Uploaded .ord file failed schema validation", result.error.flatten());
    }
    return result.data;
  }

  if (files.urdfFile) {
    const meshByBasename = new Map<string, ResolvedMesh>();
    for (const mesh of [...(files.meshFiles ?? []), ...(files.collisionMeshFiles ?? [])]) {
      const ext = extensionOf(mesh.originalname);
      if (!MESH_EXTENSIONS.has(ext)) {
        throw new ValidationError(`Unsupported mesh file type: ${mesh.originalname}`);
      }
      const storageKey = `${storagePrefix}/meshes/${mesh.originalname}`;
      await localStorage.write(storageKey, mesh.buffer);
      meshByBasename.set(mesh.originalname.toLowerCase(), { storageKey, fileType: ext as ResolvedMesh["fileType"] });
    }

    const urdfStorageKey = `${storagePrefix}/source.urdf`;
    await localStorage.write(urdfStorageKey, files.urdfFile.buffer);

    return parseUrdfToOrd(files.urdfFile.buffer.toString("utf-8"), urdfStorageKey, (urdfFilename) => {
      const basename = urdfFilename.split("/").pop()!.toLowerCase();
      return meshByBasename.get(basename);
    });
  }

  throw new ValidationError("Provide either an .ord file, or a URDF file (with its mesh files)");
}
