import { DEFS } from "./blocks";
import type { DropDest, TexNode } from "./types";

let counter = 0;
export const uid = () =>
  `n${(++counter).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function createNode(type: string): TexNode {
  const def = DEFS[type];
  const slots: Record<string, TexNode[]> = {};
  def?.slots?.forEach((s) => (slots[s.name] = []));
  return { id: uid(), type, text: def?.defaultText, slots };
}

export const cloneTree = (roots: TexNode[]): TexNode[] => structuredClone(roots);

/* ---------------- tree navigation ---------------- */

export function findLocation(
  roots: TexNode[],
  id: string,
): { list: TexNode[]; index: number } | null {
  for (let i = 0; i < roots.length; i++) {
    if (roots[i].id === id) return { list: roots, index: i };
    const deep = findInNode(roots[i], id);
    if (deep) return deep;
  }
  return null;
}

function findInNode(node: TexNode, id: string): { list: TexNode[]; index: number } | null {
  for (const key of Object.keys(node.slots)) {
    const list = node.slots[key];
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, index: i };
      const deep = findInNode(list[i], id);
      if (deep) return deep;
    }
  }
  return null;
}

export function findNode(roots: TexNode[], id: string): TexNode | null {
  for (const n of roots) {
    if (n.id === id) return n;
    const deep = findNodeIn(n, id);
    if (deep) return deep;
  }
  return null;
}
function findNodeIn(node: TexNode, id: string): TexNode | null {
  for (const key of Object.keys(node.slots)) {
    for (const child of node.slots[key]) {
      if (child.id === id) return child;
      const deep = findNodeIn(child, id);
      if (deep) return deep;
    }
  }
  return null;
}

export function removeById(roots: TexNode[], id: string): TexNode | null {
  const loc = findLocation(roots, id);
  if (!loc) return null;
  return loc.list.splice(loc.index, 1)[0];
}

/** true if `id` lives somewhere inside `node` (or is the node itself) */
export function containsId(node: TexNode, id: string): boolean {
  if (node.id === id) return true;
  for (const key of Object.keys(node.slots)) {
    for (const child of node.slots[key]) if (containsId(child, id)) return true;
  }
  return false;
}

export function countNodes(roots: TexNode[]): number {
  let n = 0;
  const walk = (node: TexNode) => {
    n++;
    Object.values(node.slots).forEach((l) => l.forEach(walk));
  };
  roots.forEach(walk);
  return n;
}

/* ---------------- insertion ---------------- */

export function insertAt(roots: TexNode[], dest: DropDest, node: TexNode): boolean {
  if (dest.kind === "root") {
    roots.push(node);
    return true;
  }
  if (dest.kind === "slot") {
    const target = findNode(roots, dest.nodeId);
    if (!target || !target.slots[dest.slot]) return false;
    target.slots[dest.slot].push(node);
    return true;
  }
  // after
  const loc = findLocation(roots, dest.nodeId);
  if (!loc) return false;
  loc.list.splice(loc.index + 1, 0, node);
  return true;
}

/** would dropping `dragId` into `dest` put it inside itself? */
export function isIllegalDrop(roots: TexNode[], dragId: string, dest: DropDest): boolean {
  if (dest.kind === "root") return false;
  if (dest.kind === "after" && dest.nodeId === dragId) return true;
  const dragged = findNode(roots, dragId);
  if (!dragged) return false;
  return containsId(dragged, dest.nodeId);
}

/* ---------------- LaTeX emission ---------------- */

const join = (ns: TexNode[]) => ns.map(toLatex).join(" ");
const arg = (ns: TexNode[]) => `{${join(ns)}}`;
const token = (ns: TexNode[]) =>
  ns.length === 0 ? "" : ns.length === 1 ? toLatex(ns[0]) : `{${join(ns)}}`;

const BIG_OPS: Record<string, string> = {
  sum: "\\sum",
  prod: "\\prod",
  integral: "\\int",
  oint: "\\oint",
};

const DELIMS: Record<string, [string, string]> = {
  paren: ["\\left(", "\\right)"],
  bracket: ["\\left[", "\\right]"],
  brace: ["\\left\\{", "\\right\\}"],
  abs: ["\\left|", "\\right|"],
  norm: ["\\left\\|", "\\right\\|"],
  ceil: ["\\left\\lceil", "\\right\\rceil"],
  floor: ["\\left\\lfloor", "\\right\\rfloor"],
  angle: ["\\left\\langle", "\\right\\rangle"],
};

const ACCENTS: Record<string, string> = {
  hat: "\\hat",
  bar: "\\bar",
  vec: "\\vec",
  dot: "\\dot",
  tilde: "\\tilde",
  overline: "\\overline",
  underline: "\\underline",
};

export function toLatex(n: TexNode): string {
  const def = DEFS[n.type];
  if (!def) return n.text ?? "";
  if (def.kind === "symbol") return def.latex ?? "";
  if (def.kind === "text") return n.text?.trim() ? n.text.trim() : "\\, ";

  const s = n.slots;

  if (BIG_OPS[n.type]) {
    let out = BIG_OPS[n.type];
    const lo = join(s.lower);
    const up = join(s.upper);
    if (lo) out += `_{${lo}}`;
    if (up) out += `^{${up}}`;
    const body = join(s.body);
    return body ? `${out} ${body}` : out;
  }

  switch (n.type) {
    case "lim": {
      let out = "\\lim";
      const under = join(s.under);
      if (under) out += `_{${under}}`;
      const body = join(s.body);
      return body ? `${out} ${body}` : out;
    }
    case "frac":
      return `\\frac${arg(s.num)}${arg(s.den)}`;
    case "binom":
      return `\\binom${arg(s.top)}${arg(s.bottom)}`;
    case "sqrt":
      return `\\sqrt${arg(s.body)}`;
    case "root":
      return `\\sqrt${arg(s.index)}${arg(s.body)}`;
    case "power":
      return `${token(s.base) || "{}"}^{${join(s.exp)}}`;
    case "sub":
      return `${token(s.base) || "{}"}_{${join(s.sub)}}`;
    case "matrix":
      return `\\begin{pmatrix} ${join(s.a)} & ${join(s.b)} \\\\ ${join(s.c)} & ${join(s.d)} \\end{pmatrix}`;
    default:
      break;
  }

  if (DELIMS[n.type]) {
    const [o, c] = DELIMS[n.type];
    return `${o} ${join(s.body)} ${c}`;
  }
  if (ACCENTS[n.type]) {
    return `${ACCENTS[n.type]}${arg(s.body)}`;
  }
  return "";
}

export const expression = (roots: TexNode[]) => roots.map(toLatex).join(" ");

export function buildDocument(roots: TexNode[], display: boolean, numbered: boolean): string {
  const body = join(roots);
  const tagged = numbered && body ? `${body} \\tag{1}` : body;
  if (display) return `\\[\n  ${tagged}\n\\]`;
  return `$${tagged}$`;
}
