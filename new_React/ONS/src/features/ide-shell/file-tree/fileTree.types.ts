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
    | "visual model folder"
    | "collision model folder"
    | "simulation folder"
    | "plc folder"
    | "hmi folder"
    | "hardware config"
    | "software config"
    | "program folder"
    | "safety program folder"
    | "Screen folder"
    | "robot Safety program file"
    | "robot program file"
    | "ld"
    | "graph"
    | "scl"
    | "db"
    | "hmi ui"
    | (string & {});
  "block type"?: "ob" | "fc" | "fb" | "db";
  icon: string;
  children?: TreeNode[];
}
