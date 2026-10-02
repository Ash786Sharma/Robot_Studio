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
    expect(ord.links.find((link) => link.name === "base_link")?.mass).toBe(4);
    expect(ord.links.find((link) => link.name === "upper_arm_link")?.centerOfMass).toEqual([0, 0, 0.28]);
    const wrist3 = ord.links.find((link) => link.name === "wrist_3_link")!;
    expect(wrist3.mass).toBeCloseTo(0.1879);
    expect(wrist3.inertia[1]).toBeCloseTo(0.000132117188);
    expect(ord.joints.find((joint) => joint.name === "shoulder_pan_joint")?.limits?.velocity).toBe(3.15);
    expect(ord.joints.find((joint) => joint.name === "wrist_3_joint")?.limits?.velocity).toBe(3.2);
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

  it("rotates inertial tensors from the inertial frame into the link frame", () => {
    const xml = `<robot name="inertial-frame">
  <link name="base">
    <inertial>
      <origin xyz="0 0 0" rpy="1.5707963267948966 0 0" />
      <mass value="1" />
      <inertia ixx="1" iyy="2" izz="3" ixy="0" ixz="0" iyz="0" />
    </inertial>
  </link>
</robot>`;

    const ord = parseUrdfToOrd(xml, "x", () => undefined);
    expect(ord.links[0].inertia[0]).toBeCloseTo(1);
    expect(ord.links[0].inertia[1]).toBeCloseTo(3);
    expect(ord.links[0].inertia[2]).toBeCloseTo(2);
  });
});
