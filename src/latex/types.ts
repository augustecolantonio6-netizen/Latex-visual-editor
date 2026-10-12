export interface TexNode {
  id: string;
  type: string;
  text?: string;
  slots: Record<string, TexNode[]>;
}

export interface SlotDef {
  name: string;
  label?: string;
}

export type BlockKind = "symbol" | "text" | "structure";

export interface BlockDef {
  type: string;
  label: string;
  category: string;
  kind: BlockKind;
  /** fixed LaTeX for symbol leaves */
  latex?: string;
  /** LaTeX rendered on the library tile */
  preview: string;
  defaultText?: string;
  slots?: SlotDef[];
  keywords?: string;
}

export interface CategoryDef {
  id: string;
  label: string;
  icon: string;
}

export type DropDest =
  | { kind: "root" }
  | { kind: "slot"; nodeId: string; slot: string }
  | { kind: "after"; nodeId: string };

export interface DragPayload {
  source: "library" | "node";
  type?: string;
  id?: string;
}
