import { useState } from "react";
import {
  Braces,
  Copy,
  Eraser,
  Eye,
  Maximize2,
  Minimize2,
  MousePointerClick,
  PencilLine,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import type { DropDest, TexNode } from "../latex/types";
import { getDragPayload } from "../latex/drag";
import { BlockView, type BlockActions } from "./BlockView";
import { renderMath } from "./M";
import { cn } from "../utils/cn";

interface CanvasProps {
  roots: TexNode[];
  count: number;
  title: string;
  setTitle: (t: string) => void;
  actions: BlockActions;
  handleDrop: (dest: DropDest) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  clearAll: () => void;
  latex: string;
  displayMode: boolean;
}

export function Canvas(props: CanvasProps) {
  const { roots, count, actions } = props;
  const [tab, setTab] = useState<"compose" | "preview">("compose");
  const [zoom, setZoom] = useState(100);
  const [full, setFull] = useState(false);
  const [over, setOver] = useState(false);

  const panel = (
    <section
      className={cn(
        "rise flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_30px_-18px_rgba(31,74,51,0.25)]",
        full && "fixed inset-4 z-50 shadow-2xl",
      )}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-pine-700">
            <Braces size={15} />
          </span>
          <input
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            className="w-full min-w-0 truncate rounded-md bg-transparent px-1.5 py-1 font-display text-[15px] font-semibold tracking-tight outline-none transition hover:bg-sage-50 focus:bg-white focus:shadow-[0_0_0_2px_var(--color-pine-400)]"
            aria-label="nom de l'expression"
          />
          <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-pine-500" title="modifications suivies" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions.selectedId && (
            <button
              onClick={props.duplicateSelected}
              title="Dupliquer le bloc sélectionné"
              className="rounded-md p-2 text-mute transition hover:bg-sage-100 hover:text-pine-700"
            >
              <Copy size={15} />
            </button>
          )}
          {actions.selectedId && (
            <button
              onClick={props.deleteSelected}
              title="Supprimer le bloc sélectionné (⌫)"
              className="rounded-md p-2 text-mute transition hover:bg-rust/10 hover:text-rust"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={props.undo}
            disabled={!props.canUndo}
            title="Annuler (⌘Z)"
            className="rounded-md p-2 text-mute transition enabled:hover:bg-sage-100 enabled:hover:text-pine-700 disabled:opacity-30"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={props.redo}
            disabled={!props.canRedo}
            title="Rétablir (⌘⇧Z)"
            className="rounded-md p-2 text-mute transition enabled:hover:bg-sage-100 enabled:hover:text-pine-700 disabled:opacity-30"
          >
            <Redo2 size={15} />
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          <button
            onClick={props.clearAll}
            disabled={count === 0}
            title="Tout effacer"
            className="rounded-md p-2 text-mute transition enabled:hover:bg-rust/10 enabled:hover:text-rust disabled:opacity-30"
          >
            <Eraser size={15} />
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between border-b border-line bg-sage-50/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab("compose")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition",
              tab === "compose" ? "bg-panel text-pine-700 shadow-sm" : "text-mute hover:text-ink",
            )}
          >
            <PencilLine size={13} /> Composition
          </button>
          <button
            onClick={() => setTab("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition",
              tab === "preview" ? "bg-panel text-pine-700 shadow-sm" : "text-mute hover:text-ink",
            )}
          >
            <Eye size={13} /> Aperçu
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="rounded-md border border-line bg-panel px-2 py-1 text-[12px] font-medium text-mute outline-none focus:border-pine-400"
            aria-label="zoom"
          >
            {[75, 100, 125, 150].map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
          </select>
          <button
            onClick={() => setFull((f) => !f)}
            title={full ? "Quitter le plein écran" : "Plein écran"}
            className="rounded-md p-1.5 text-mute transition hover:bg-sage-100 hover:text-pine-700"
          >
            {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* body */}
      {tab === "compose" ? (
        <div
          className="dotgrid relative min-h-0 flex-1 overflow-auto nice-scroll"
          onClick={() => {
            actions.select(null);
            actions.setActiveSlot(null);
          }}
          onDragOver={(e) => {
            if (!getDragPayload()) return;
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            props.handleDrop({ kind: "root" });
          }}
        >
          <div
            className="pointer-events-none absolute left-5 top-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-faint"
          >
            Votre expression
          </div>
          <div className="absolute right-5 top-3 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-pine-700">
            {count} bloc{count > 1 ? "s" : ""}
          </div>

          <div
            className="flex min-h-full items-center justify-center px-6 py-10"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
          >
            {roots.length === 0 ? (
              <div className="flex max-w-md flex-col items-center text-center">
                <div className="mb-5 flex items-end gap-4 text-pine-500/70">
                  <span className="drift text-[64px] font-light leading-none">Σ</span>
                  <span className="pb-3 text-[26px] font-light text-sage-400">+</span>
                  <span className="drift-slow text-[58px] font-light leading-none">√</span>
                </div>
                <h3 className="font-display text-[22px] font-bold tracking-tight text-ink">
                  Tout commence par un bloc.
                </h3>
                <p className="mt-1.5 text-[13.5px] text-mute">
                  Choisissez un symbole dans la bibliothèque, puis emboîtez vos idées.
                </p>
                <div
                  className={cn(
                    "mt-7 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-4 text-[13px] font-medium transition",
                    over
                      ? "border-pine-500 bg-sage-100 text-pine-700"
                      : "border-sage-300 text-mute",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sage-200 text-[14px] leading-none text-pine-700">
                    +
                  </span>
                  Glissez un bloc ici pour commencer
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div
                  className={cn(
                    "mx-auto flex min-h-[120px] w-fit max-w-full flex-wrap items-center gap-1 rounded-xl px-5 py-4 text-[1.15rem] transition",
                    over && "bg-sage-100/70 shadow-[0_0_0_2px_var(--color-pine-400)]",
                  )}
                >
                  {roots.map((n) => (
                    <BlockView key={n.id} node={n} actions={actions} />
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-faint">
                  <MousePointerClick size={13} className="text-sage-400" />
                  Cliquez sur un terme pour le modifier · cliquez sur un pointillé pour cibler l'insertion
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dotgrid flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
          {roots.length === 0 ? (
            <p className="text-[13.5px] text-mute">Votre expression apparaîtra ici.</p>
          ) : (
            <div
              className="preview-math rounded-xl bg-panel/80 px-8 py-6 shadow-sm"
              style={{ fontSize: `${(zoom / 100) * 1.5}rem` }}
              dangerouslySetInnerHTML={{ __html: renderMath(props.latex || "\\,", props.displayMode) }}
            />
          )}
        </div>
      )}

      {/* status bar */}
      <div className="flex items-center justify-between border-t border-line bg-sage-50/50 px-4 py-2">
        <span className="flex items-center gap-1.5 text-[11.5px] text-mute">
          <span className="h-1.5 w-1.5 rounded-full bg-pine-500" /> Sauvegarde automatique
        </span>
        <span className="text-[11.5px] text-faint">
          <kbd className="rounded border border-line bg-panel px-1 text-[10px]">⌘Z</kbd> pour annuler
        </span>
      </div>
    </section>
  );

  return panel;
}
