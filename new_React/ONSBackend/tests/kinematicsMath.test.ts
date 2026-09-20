import { describe, expect, it } from "vitest";
import {
  deriveDhChain,
  deriveScrewAxis,
  transformToDualQuaternion,
  IDENTITY_TRANSFORM,
  composeTransform,
  type Vec3,
} from "../src/modules/robots/kinematicsMath.js";

describe("deriveDhChain", () => {
  it("computes a=link length, alpha=0 for two parallel Z axes offset along X", () => {
    const chain = [
      { point: [0, 0, 0] as Vec3, axis: [0, 0, 1] as Vec3 },
      { point: [1, 0, 0] as Vec3, axis: [0, 0, 1] as Vec3 },
    ];

    const dh = deriveDhChain(chain);

    expect(dh).toHaveLength(2);
    // Second joint is offset 1 unit along X from the first, both axes parallel to Z.
    expect(dh[1].a).toBeCloseTo(1, 6);
    expect(dh[1].alpha).toBeCloseTo(0, 6);
  });

  it("computes alpha=pi/2 for two perpendicular joint axes (Z then X)", () => {
    const chain = [
      { point: [0, 0, 0] as Vec3, axis: [0, 0, 1] as Vec3 },
      { point: [0, 0, 1] as Vec3, axis: [1, 0, 0] as Vec3 },
    ];

    const dh = deriveDhChain(chain);
    expect(Math.abs(dh[1].alpha)).toBeCloseTo(Math.PI / 2, 6);
  });
});

describe("deriveScrewAxis", () => {
  it("returns omega=axis, v=-omega x q for a revolute joint about Z at (1,0,0)", () => {
    const { omega, v } = deriveScrewAxis("revolute", [0, 0, 1], [1, 0, 0]);
    expect(omega).toEqual([0, 0, 1]);
    // -omega x q = -(0,0,1)x(1,0,0) = -(0,1,0) = (0,-1,0)
    expect(v[0]).toBeCloseTo(0, 6);
    expect(v[1]).toBeCloseTo(-1, 6);
    expect(v[2]).toBeCloseTo(0, 6);
  });

  it("returns omega=0, v=axis for a prismatic joint", () => {
    const { omega, v } = deriveScrewAxis("prismatic", [0, 1, 0], [5, 5, 5]);
    expect(omega).toEqual([0, 0, 0]);
    expect(v).toEqual([0, 1, 0]);
  });
});

describe("transformToDualQuaternion", () => {
  it("encodes pure translation with identity rotation in the dual part", () => {
    const transform = composeTransform(IDENTITY_TRANSFORM, [1, 2, 3], [0, 0, 0]);
    const dq = transformToDualQuaternion(transform);

    expect(dq.real).toEqual([1, 0, 0, 0]);
    // dual = 0.5 * [0, t] * real(identity) = 0.5 * [0, t]
    expect(dq.dual[0]).toBeCloseTo(0, 6);
    expect(dq.dual[1]).toBeCloseTo(0.5, 6);
    expect(dq.dual[2]).toBeCloseTo(1, 6);
    expect(dq.dual[3]).toBeCloseTo(1.5, 6);
  });
});
