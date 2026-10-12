import { useState } from "react";
import type { DropDest, TexNode } from "../latex/types";
import { DEFS } from "../latex/blocks";
import { getDragPayload, setDragPayload } from "../latex/drag";
import { M } from "./M";
import { cn } from "../utils/cn";

export interface BlockActions {
  selectedId: string | null;
  select: (id: string | null) => void;
  activeSlot: { nodeId: string; name: string } | null;
  setActiveSlot: (s: { nodeId: string; name: string } | null) => void;
  drop: (dest: DropDest) => void;
  updateText: (id: string, text: string) => void;
  commit: () => void;
}

/* ------------------------------ Slot ------------------------------ */

function Slot({
  parent,
  name,
  small,
  actions,
}: {
  parent: TexNode;
  name: string;
  small?: boolean;
  actions: BlockActions;
}) {
  const children = parent.slots[name] ?? [];
  const [over, setOver] = useState(false);
  const isActive =
    actions.activeSlot?.nodeId === parent.id && actions.activeSlot?.name === name;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        actions.setActiveSlot({ nodeId: parent.id, name });
      }}
      onDragOver={(e) => {
        if (!getDragPayload()) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        actions.drop({ kind: "slot", nodeId: parent.id, slot: name });
      }}
      className={cn(
        "slot flex items-center justify-center gap-0.5",
        small ? "min-w-[18px] min-h-[18px] px-1 py-[2px]" : "min-w-[26px] min-h-[30px] px-1.5 py-[3px]",
        isActive && "slot-active",
        over && "slot-over",
      )}
    >
      {children.length === 0 ? (
        <span className="select-none text-[10px] leading-none text-faint">·</span>
      ) : (
        children.map((c) => <BlockView key={c.id} node={c} actions={actions} />)
      )}
    </div>
  );
}

/* --------------------------- Block body --------------------------- */

const BIG: Record<string, string> = {
  sum: "\\sum",
  prod: "\\prod",
  integral: "\\int",
  oint: "\\oint",
};

const DELIM_CHARS: Record<string, [string, string]> = {
  paren: ["(", ")"],
  bracket: ["[", "]"],
  brace: ["{", "}"],
  abs: ["|", "|"],
  norm: ["‖", "‖"],
  ceil: ["⌈", "⌉"],
  floor: ["⌊", "⌋"],
  angle: ["⟨", "⟩"],
};

const ACCENT_MARK: Record<string, string> = {
  hat: "ˆ",
  tilde: "˜",
  vec: "→",
  dot: "•",
};

function Body({ node, actions }: { node: TexNode; actions: BlockActions }) {
  const def = DEFS[node.type];
  if (!def) return null;

  if (def.kind === "symbol") {
    return <M tex={def.latex ?? ""} className="text-[1.05rem]" />;
  }

  if (def.kind === "text") {
    const text = node.text ?? "";
    return (
      <input
        className="term-input px-1 py-0.5 text-center font-body text-[0.95rem] italic text-ink"
        value={text}
        draggable={false}
        style={{ width: `${Math.max(2, text.length + 1)}ch` }}
        onFocus={actions.commit}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => actions.updateText(node.id, e.target.value)}
        aria-label="terme éditable"
      />
    );
  }

  if (BIG[node.type]) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="flex flex-col items-center leading-none">
          <Slot parent={node} name="upper" small actions={actions} />
          <M tex={BIG[node.type]} className="my-[3px] text-[1.7rem]" />
          <Slot parent={node} name="lower" small actions={actions} />
        </span>
        <Slot parent={node} name="body" actions={actions} />
      </span>
    );
  }

  switch (node.type) {
    case "lim":
      return (
        <span className="flex items-center gap-1.5">
          <span className="flex flex-col items-center leading-none">
            <M tex="\\lim" className="text-[1.05rem]" />
            <Slot parent={node} name="under" small actions={actions} />
          </span>
          <Slot parent={node} name="body" actions={actions} />
        </span>
      );
    case "frac":
      return (
        <span className="flex flex-col items-center">
          <Slot parent={node} name="num" actions={actions} />
          <span className="my-[2px] h-[1.5px] w-full rounded bg-ink/75" />
          <Slot parent={node} name="den" actions={actions} />
        </span>
      );
    case "binom":
      return (
        <span className="flex items-center">
          <span className="-mr-0.5 text-[2.3rem] font-extralight leading-none text-ink/80">(</span>
          <span className="flex flex-col items-center gap-1">
            <Slot parent={node} name="top" small actions={actions} />
            <Slot parent={node} name="bottom" small actions={actions} />
          </span>
          <span className="-ml-0.5 text-[2.3rem] font-extralight leading-none text-ink/80">)</span>
        </span>
      );
    case "sqrt":
      return (
        <span className="flex items-start">
          <span className="-mr-[1px] text-[1.5rem] leading-none text-ink/90">√</span>
          <span className="-mt-[3px] border-t-[1.5px] border-ink/75 pt-[3px]">
            <Slot parent={node} name="body" actions={actions} />
          </span>
        </span>
      );
    case "root":
      return (
        <span className="flex items-start">
          <span className="z-10 -mr-1 mt-0">
            <Slot parent={node} name="index" small actions={actions} />
          </span>
          <span className="-mr-[1px] text-[1.5rem] leading-none text-ink/90">√</span>
          <span className="-mt-[3px] border-t-[1.5px] border-ink/75 pt-[3px]">
            <Slot parent={node} name="body" actions={actions} />
          </span>
        </span>
      );
    case "power":
      return (
        <span className="flex items-start">
          <Slot parent={node} name="base" actions={actions} />
          <span className="-mt-[14px] ml-[2px]">
            <Slot parent={node} name="exp" small actions={actions} />
          </span>
        </span>
      );
    case "sub":
      return (
        <span className="flex items-end">
          <Slot parent={node} name="base" actions={actions} />
          <span className="-mb-[12px] ml-[2px]">
            <Slot parent={node} name="sub" small actions={actions} />
          </span>
        </span>
      );
    case "matrix":
      return (
        <span className="flex items-center">
          <span className="-mr-1 text-[2.6rem] font-extralight leading-none text-ink/80">(</span>
          <span className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 px-1">
            {["a", "b", "c", "d"].map((k) => (
              <Slot key={k} parent={node} name={k} small actions={actions} />
            ))}
          </span>
          <span className="-ml-1 text-[2.6rem] font-extralight leading-none text-ink/80">)</span>
        </span>
      );
    default:
      break;
  }

  if (DELIM_CHARS[node.type]) {
    const [o, c] = DELIM_CHARS[node.type];
    return (
      <span className="flex items-center">
        <span className="-mr-0.5 text-[1.9rem] font-extralight leading-none text-ink/80">{o}</span>
        <Slot parent={node} name="body" actions={actions} />
        <span className="-ml-0.5 text-[1.9rem] font-extralight leading-none text-ink/80">{c}</span>
      </span>
    );
  }

  if (ACCENT_MARK[node.type]) {
    return (
      <span className="flex flex-col items-center leading-none">
        <span className="-mb-[2px] text-[0.72rem] text-ink/85">{ACCENT_MARK[node.type]}</span>
        <Slot parent={node} name="body" small actions={actions} />
      </span>
    );
  }
  if (node.type === "bar" || node.type === "overline") {
    return (
      <span className="border-t-[1.5px] border-ink/75 pt-[3px]">
        <Slot parent={node} name="body" small actions={actions} />
      </span>
    );
  }
  if (node.type === "underline") {
    return (
      <span className="border-b-[1.5px] border-ink/75 pb-[3px]">
        <Slot parent={node} name="body" small actions={actions} />
      </span>
    );
  }

  return null;
}

/* --------------------------- Block view --------------------------- */

export function BlockView({ node, actions }: { node: TexNode; actions: BlockActions }) {
  const selected = actions.selectedId === node.id;
  const [after, setAfter] = useState(false);

  return (
    <span
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        setDragPayload({ source: "node", id: node.id });
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", node.id);
        } catch {
          /* noop */
        }
      }}
      onDragEnd={() => setDragPayload(null)}
      onDragOver={(e) => {
        if (!getDragPayload()) return;
        e.preventDefault();
        e.stopPropagation();
        setAfter(true);
      }}
      onDragLeave={() => setAfter(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setAfter(false);
        actions.drop({ kind: "after", nodeId: node.id });
      }}
      onClick={(e) => {
        e.stopPropagation();
        actions.select(node.id);
      }}
      className={cn(
        "block-node pop-in relative inline-flex items-center px-[3px] py-[2px]",
        selected && "block-selected",
      )}
    >
      <Body node={node} actions={actions} />
      {after && (
        <span className="pointer-events-none absolute -right-[3px] top-0 h-full w-[3px] rounded-full bg-pine-500" />
      )}
    </span>
  );
}
