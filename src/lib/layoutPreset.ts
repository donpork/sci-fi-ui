export type MicroSplit = "h" | "v";
export type LayoutOrdering = "sequential" | "organized" | "fixed";

export type LayoutCellDef = {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  type: "normal" | "super" | "micro" | "empty";
  microCount?: 2 | 3;
  microSplit?: MicroSplit;
  label?: string;
  microLabels?: string[];
};

export type LayoutPreset = {
  name: string;
  ordering: LayoutOrdering;
  cols: number;
  rows: number;
  cells: LayoutCellDef[];
};

function c(
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  type: LayoutCellDef["type"]
): LayoutCellDef {
  return { id: `${row}-${col}`, row, col, rowSpan, colSpan, type };
}

/** One supercell spanning the full 2×2 grid. */
export const PRESET_SINGLE: LayoutPreset = {
  name: "Single",
  ordering: "fixed",
  cols: 2,
  rows: 2,
  cells: [c(0, 0, 2, 2, "super")],
};
