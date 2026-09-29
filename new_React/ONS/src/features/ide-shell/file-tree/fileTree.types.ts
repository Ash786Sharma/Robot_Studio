export interface TreeNode {
  id: string;
  name: string;
  // Widened from a closed union to `string` since real projects/backend file
  // types are now open-ended (server-defined `fileType`), not just this fixed set.
  type:
    | "Project workspace"
    | "device folder"
    | "robot folder"
    | "robot layer folder"
    | "kinematic link"
    | "kinematic joint"
    | "plc folder"
    | "hmi folder"
    | "hardware config"
    | "software config"
    | "program folder"
    | "safety program folder"
    | "robot program folder"
    | "robot safety program folder"
    | "plc program folder"
    | "plc safety program folder"
    | "Screen folder"
    | "robot Safety program file"
    | "robot program file"
    | "rprg"
    | "rgprg"
    | "rsprg"
    | "rsgprg"
    | "ld"
    | "graph"
    | "scl"
    | "db"
    | "hmi ui"
    | (string & {});
  "block type"?: "ob" | "fc" | "fb" | "db";
  icon: string;
  kind?: "folder" | "file";
  fileType?: string | null;
  /** Kinematic link nodes only: storage key of the associated visual/collision mesh, if any. */
  visualMeshKey?: string | null;
  collisionMeshKey?: string | null;
  children?: TreeNode[];
}
