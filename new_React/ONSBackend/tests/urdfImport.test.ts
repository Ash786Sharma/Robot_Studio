import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseUrdfToOrd } from "../src/modules/robots/urdfImport.service.js";
import { ordSchema } from "../src/modules/robots/ord.schema.js";

describe("parseUrdfToOrd", () => {
  it("derives a valid .ord document from the real UR5 sample URDF", () => {
    const urdfPath = path.resolve(__dirname, "../../ONS/public/ur5.urdf");
    const xml = readFileSync(urdfPath, "utf-8");

    const ord = parseUrdfToOrd(xml, "library/ur5/ur5.urdf", (filename) => ({
      storageKey: `library/ur5/${filename}`,
      fileType: filename.endsWith(".dae") ? "dae" : "stl",
    }));

    const result = ordSchema.safeParse(ord);
    expect(result.success).toBe(true);

    expect(ord.name).toBe("ur5");
    expect(ord.links).toHaveLength(7);
    expect(ord.joints).toHaveLength(6);
    // UR5 is a pure serial chain, so every joint sits on the DH reference chain.
    for (const joint of ord.joints) {
      expect(joint.type).toBe("revolute");
      expect(joint.dh).toBeDefined();
      expect(joint.screwAxis).toBeDefined();
    }
    expect(ord.meshes.visual.length).toBeGreaterThan(0);
    expect(ord.meshes.collision.length).toBeGreaterThan(0);
  });

  it("rejects unsupported joint types", () => {
    const xml = `<?xml version="1.0"?>
<robot name="bad">
  <link name="base"/>
  <link name="tip"/>
  <joint name="j1" type="floating"><parent link="base"/><child link="tip"/></joint>
</robot>`;
    expect(() => parseUrdfToOrd(xml, "x", () => undefined)).toThrow(/Unsupported joint type/);
  });
});
