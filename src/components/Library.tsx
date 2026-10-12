import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Braces,
  Calculator,
  ChevronDown,
  ChevronRight,
  Command,
  Layers,
  MousePointerClick,
  Omega,
  Parentheses,
  Search,
  Sigma,
  Star,
} from "lucide-react";
import { BLOCKS, CATEGORIES, CATEGORY_COUNT } from "../latex/blocks";
import type { BlockDef } from "../latex/types";
import { setDragPayload } from "../latex/drag";
import { M } from "./M";
import { cn } from "../utils/cn";

const CAT_ICON: Record<string, typeof Sigma> = {
  operators: Sigma,
  relations: ArrowLeftRight,
  greek: Omega,
  sets: Braces,
  delims: Parentheses,
  functions: Calculator,
};

function Tile({
  def,
  fav,
  onFav,
  onAdd,
  small,
}: {
  def: BlockDef;
  fav: boolean;
  onFav: () => void;
  onAdd: () => void;
  small?: boolean;
}) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        setDragPayload({ source: "library", type: def.type });
        e.dataTransfer.effectAllowed = "copy";
        try {
          e.dataTransfer.setData("text/plain", def.type);
        } catch {
          /* noop */
        }
      }}
      onDragEnd={() => setDragPayload(null)}
      onClick={onAdd}
      title={`${def.label} — glisser ou cliquer`}
      className={cn(
        "lib-tile group relative flex flex-col items-center justify-center gap-1 rounded-lg border bg-panel",
        small ? "h-[58px]" : "h-[74px]",
        fav ? "border-sage-300 bg-sage-50" : "border-line",
      )}
    >
      <span
        className={cn("tile-math flex h-8 items-center justify-center", small && "tile-math-sm")}
      >
        {def.kind === "text" ? (
          <span className="font-body text-[1.05rem] italic text-ink">abc</span>
        ) : (
          <M tex={def.preview} />
        )}
      </span>
      {!small && (
        <span className="px-1 text-[10.5px] font-medium leading-none text-mute">{def.label}</span>
      )}
      <span
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFav();
        }}
        className={cn(
          "absolute right-1 top-1 rounded p-0.5 transition",
          fav
            ? "text-amber-warn"
            : "text-faint opacity-0 group-hover:opacity-100 hover:text-amber-warn",
        )}
      >
        <Star size={11} fill={fav ? "currentColor" : "none"} />
      </span>
    </button>
  );
}

export function Library({
  onAdd,
  favorites,
  toggleFavorite,
}: {
  onAdd: (type: string) => void;
  favorites: Set<string>;
  toggleFavorite: (type: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "fav">("all");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return BLOCKS.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        (b.keywords ?? "").toLowerCase().includes(q) ||
        (b.latex ?? "").toLowerCase().includes(q),
    );
  }, [query]);

  const toggleCat = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const favBlocks = useMemo(() => BLOCKS.filter((b) => favorites.has(b.type)), [favorites]);

  return (
    <aside className="rise flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_30px_-18px_rgba(31,74,51,0.25)]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-600 text-sage-100">
            <Layers size={16} />
          </span>
          <h2 className="font-display text-[15px] font-semibold tracking-tight">
            Bibliothèque
          </h2>
        </div>
        <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-pine-700">
          {BLOCKS.length} blocs
        </span>
      </div>

      {/* search */}
      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 transition focus-within:border-pine-400 focus-within:bg-white">
          <Search size={14} className="text-faint" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un symbole…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
          <kbd className="flex items-center gap-0.5 rounded border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-mute">
            <Command size={9} /> K
          </kbd>
        </div>

        {/* tabs */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-paper p-1">
          {(["all", "fav"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-semibold transition",
                tab === t ? "bg-panel text-ink shadow-sm" : "text-mute hover:text-ink",
              )}
            >
              {t === "fav" && <Star size={11} className={favorites.size ? "text-amber-warn" : ""} />}
              {t === "all" ? "Tous les blocs" : `Favoris${favorites.size ? ` (${favorites.size})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2">
        {results ? (
          <>
            <p className="px-1 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {results.length} résultat{results.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {results.map((b) => (
                <Tile
                  key={b.type}
                  def={b}
                  fav={favorites.has(b.type)}
                  onFav={() => toggleFavorite(b.type)}
                  onAdd={() => onAdd(b.type)}
                />
              ))}
            </div>
            {results.length === 0 && (
              <p className="px-1 py-6 text-center text-[12.5px] text-mute">
                Aucun bloc ne correspond à « {query} ».
              </p>
            )}
          </>
        ) : tab === "fav" ? (
          favBlocks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Star size={20} className="text-faint" />
              <p className="text-[12.5px] leading-relaxed text-mute">
                Survolez un bloc et touchez l'étoile pour le garder sous la main.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {favBlocks.map((b) => (
                <Tile
                  key={b.type}
                  def={b}
                  fav
                  onFav={() => toggleFavorite(b.type)}
                  onAdd={() => onAdd(b.type)}
                />
              ))}
            </div>
          )
        ) : (
          CATEGORIES.map((cat) => {
            const Icon = CAT_ICON[cat.id] ?? Sigma;
            const open = !closed.has(cat.id);
            const blocks = BLOCKS.filter((b) => b.category === cat.id);
            const compact = cat.id === "greek" || cat.id === "relations" || cat.id === "sets";
            return (
              <div key={cat.id} className="border-b border-line/70 py-1.5 last:border-0">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="flex w-full items-center justify-between rounded-md px-1.5 py-2 text-left transition hover:bg-sage-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} className="text-pine-600" />
                    <span className="text-[13px] font-semibold text-ink">{cat.label}</span>
                    <span className="text-[11px] text-faint">{CATEGORY_COUNT(cat.id)}</span>
                  </span>
                  {open ? (
                    <ChevronDown size={14} className="text-faint" />
                  ) : (
                    <ChevronRight size={14} className="text-faint" />
                  )}
                </button>
                {open && (
                  <div className={cn("grid gap-2 pb-2 pt-1", compact ? "grid-cols-4" : "grid-cols-3")}>
                    {blocks.map((b) => (
                      <Tile
                        key={b.type}
                        def={b}
                        small={compact}
                        fav={favorites.has(b.type)}
                        onFav={() => toggleFavorite(b.type)}
                        onAdd={() => onAdd(b.type)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* footer hint */}
      <div className="flex items-center gap-2 border-t border-line bg-sage-50/60 px-4 py-2.5">
        <MousePointerClick size={13} className="text-pine-500" />
        <p className="text-[11.5px] text-mute">Glissez un bloc, ou cliquez pour l'ajouter.</p>
      </div>
    </aside>
  );
}
