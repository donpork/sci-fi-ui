import { describe, expect, it } from "vitest";
import { makeLabelsFromPreset } from "./cellLabelGrid";
import { PRESET_SINGLE } from "./layoutPreset";

describe("makeLabelsFromPreset", () => {
  it("generates label for the single cell", () => {
    const labels = makeLabelsFromPreset(PRESET_SINGLE);
    expect(labels).toEqual({ "0-0": "R1C1" });
  });
});
