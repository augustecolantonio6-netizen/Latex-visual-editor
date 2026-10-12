import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Keyboard, Lock, Route, Sparkles } from "lucide-react";
import { useHistory } from "./hooks/useHistory";
import { Library } from "./components/Library";
import { Canvas } from "./components/Canvas";
import { OutputPanel } from "./components/OutputPanel";
import type { BlockActions } from "./components/BlockView";
import type { DropDest, TexNode } from "./latex/types";
import {
  buildDocument,
  cloneTree,
  countNodes,
  createNode,
  expression,
  findNode,
  insertAt,
  isIllegalDrop,
  removeById,
  uid,
} from "./latex/engine";
import { getDragPayload, setDragPayload } from "./latex/drag";
import { cn } from "./utils/cn";

const STORE = "atelier-latex-v1";

function mkText(text: string): TexNode {
  const n = createNode("text");
  n.text = text;
  return n;
}

function sample(): TexNode[] {
  const sum = createNode("sum");
  sum.slots.lower = [mkText("i = 1")];
  sum.slots.upper = [mkText("n")];
  const frac = createNode("frac");
  frac.slots.num = [mkText("1")];
  const pow = createNode("power");
  pow.slots.base = [mkText("i")];
  pow.slots.exp = [mkText("2")];
  frac.slots.den = [pow];
  sum.slots.body = [frac];

  const leq = createNode("leq");

  const rhs = createNode("frac");
  const pi2 = createNode("power");
  pi2.slots.base = [createNode("pi")];
  pi2.slots.exp = [mkText("2")];
  rhs.slots.num = [pi2];
  rhs.slots.den = [mkText("6")];

  return [sum, leq, rhs];
}

function cloneWithNewIds(n: TexNode): TexNode {
  const c: TexNode = { id: uid(), type: n.type, text: n.text, slots: {} };
  for (const k of Object.keys(n.slots)) c.slots[k] = n.slots[k].map(cloneWithNewIds);
  return c;
}

interface Persisted {
  roots: TexNode[];
  title: string;
  favorites: string[];
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

export default function App() {
  const persisted = useRef(loadPersisted()).current;

  const history = useHistory<TexNode[]>(persisted?.roots?.length ? persisted.roots : sample());
  const [title, setTitle] = useState(persisted?.title ?? "Ma première expression");
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(persisted?.favorites ?? ["sum", "frac", "sqrt", "integral", "power"]),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<{ nodeId: string; name: string } | null>(null);
  const [displayMode, setDisplayMode] = useState(true);
  const [fontSize, setFontSize] = useState(26);
  const [numbered, setNumbered] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);

  const roots = history.state;

  /* ---------- persistence ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORE,
          JSON.stringify({ roots, title, favorites: [...favorites] } satisfies Persisted),
        );
      } catch {
        /* storage full or blocked */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [roots, title, favorites]);

  /* ---------- mutations ---------- */
  const drop = useCallback(
    (dest: DropDest) => {
      const payload = getDragPayload();
      setDragPayload(null);
      if (!payload) return;
      history.set((prev) => {
        const next = cloneTree(prev);
        if (payload.source === "library" && payload.type) {
          const node = createNode(payload.type);
          if (insertAt(next, dest, node)) {
            setTimeout(() => setSelectedId(node.id), 0);
            return next;
          }
          return prev;
        }
        if (payload.source === "node" && payload.id) {
          if (isIllegalDrop(prev, payload.id, dest)) return prev;
          const loc = removeById(next, payload.id);
          if (!loc) return prev;
          if (dest.kind === "after" && dest.nodeId === loc.id) return prev;
          insertAt(next, dest, loc);
          return next;
        }
        return prev;
      });
    },
    [history],
  );

  const addFromLibrary = useCallback(
    (type: string) => {
      history.set((prev) => {
        const next = cloneTree(prev);
        const node = createNode(type);
        let dest: DropDest = { kind: "root" };
        if (activeSlot && findNode(next, activeSlot.nodeId)) {
          dest = { kind: "slot", nodeId: activeSlot.nodeId, slot: activeSlot.name };
        }
        insertAt(next, dest, node);
        setTimeout(() => setSelectedId(node.id), 0);
        return next;
      });
    },
    [history, activeSlot],
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      history.set(
        (prev) => {
          const next = cloneTree(prev);
          const n = findNode(next, id);
          if (n) n.text = text;
          return next;
        },
        false,
      );
    },
    [history],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    history.set((prev) => {
      const next = cloneTree(prev);
      removeById(next, selectedId);
      return next;
    });
    setSelectedId(null);
    setActiveSlot(null);
  }, [history, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    history.set((prev) => {
      const next = cloneTree(prev);
      const n = findNode(next, selectedId);
      if (!n) return prev;
      insertAt(next, { kind: "after", nodeId: selectedId }, cloneWithNewIds(n));
      return next;
    });
  }, [history, selectedId]);

  const clearAll = useCallback(() => {
    history.set(() => []);
    setSelectedId(null);
    setActiveSlot(null);
  }, [history]);

  const toggleFavorite = useCallback((type: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setActiveSlot(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [history, selectedId, deleteSelected]);

  /* ---------- derived ---------- */
  const expr = useMemo(() => expression(roots), [roots]);
  const tagged = numbered && displayMode && expr.trim() ? `${expr} \\tag{1}` : expr;
  const code = useMemo(
    () => buildDocument(roots, displayMode, numbered),
    [roots, displayMode, numbered],
  );
  const count = useMemo(() => countNodes(roots), [roots]);

  const actions: BlockActions = useMemo(
    () => ({
      selectedId,
      select: (id) => {
        setSelectedId(id);
        if (id) setActiveSlot(null);
      },
      activeSlot,
      setActiveSlot: (s) => {
        setActiveSlot(s);
        if (s) setSelectedId(null);
      },
      drop,
      updateText,
      commit: history.commit,
    }),
    [selectedId, activeSlot, drop, updateText, history.commit],
  );

  /* ---------- layout ---------- */
  return (
    <div className="app-bg flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      {/* top bar */}
      <header className="flex items-center justify-between px-5 pb-1 pt-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[17px] font-extrabold tracking-tight text-pine-700">
            <span className="mr-1 italic">ƒ.</span>Atelier
          </span>
          <p className="hidden text-[12.5px] text-mute sm:block">
            Assemblez vos blocs. Ajustez vos termes. Le LaTeX s'écrit tout seul.
          </p>
        </div>
        <span className="hidden items-center gap-1.5 text-[11.5px] text-faint md:flex">
          <Sparkles size={12} className="text-sage-400" />
          {count > 0 ? `${count} bloc${count > 1 ? "s" : ""} assemblé${count > 1 ? "s" : ""}` : "prêt à composer"}
        </span>
      </header>

      {/* main */}
      <main className="mx-auto grid w-full max-w-[1640px] flex-1 grid-cols-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[288px_minmax(0,1fr)_336px]">
        <div className="min-h-[420px] lg:h-full lg:min-h-0">
          <Library onAdd={addFromLibrary} favorites={favorites} toggleFavorite={toggleFavorite} />
        </div>

        <div className="flex min-h-[560px] flex-col gap-4 lg:min-h-0">
          <div className="min-h-0 flex-1">
            <Canvas
              roots={roots}
              count={count}
              title={title}
              setTitle={setTitle}
              actions={actions}
              handleDrop={drop}
              undo={history.undo}
              redo={history.redo}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              duplicateSelected={duplicateSelected}
              deleteSelected={deleteSelected}
              clearAll={clearAll}
              latex={tagged}
              displayMode={displayMode}
            />
          </div>

          {/* guide strip */}
          <section className="rise rounded-2xl border border-line bg-sage-50/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-[13.5px] font-bold tracking-tight text-ink">
                <Route size={15} className="text-pine-600" /> Simple comme 1, 2, 3.
              </p>
              <button
                onClick={() => setGuideOpen((v) => !v)}
                className="flex items-center gap-1 text-[12px] font-semibold text-pine-700 transition hover:text-pine-800"
              >
                {guideOpen ? "Replier le guide" : "Découvrir le guide"}
                <ArrowUpRight size={12} className={cn("transition", guideOpen && "rotate-90")} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                ["1", "Glissez", "Choisissez votre bloc dans la bibliothèque"],
                ["2", "Assemblez", "Emboîtez les slots : bornes, numérateurs, indices…"],
                ["3", "Exportez", "Votre LaTeX est prêt, copiez ou téléchargez"],
              ].map(([n, t, d], i) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sage-300 bg-panel text-[12px] font-bold text-pine-700">
                    {n}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">{t}</p>
                    <p className="text-[11.5px] leading-snug text-mute">{d}</p>
                  </div>
                  {i < 2 && <span className="ml-auto hidden text-faint sm:block">›</span>}
                </div>
              ))}
            </div>
            {guideOpen && (
              <div className="rise mt-4 grid gap-3 border-t border-sage-200 pt-4 text-[12.5px] leading-relaxed text-mute sm:grid-cols-3">
                <p>
                  <strong className="text-ink">Glisser-déposer :</strong> tirez un bloc de la
                  bibliothèque vers la zone centrale, ou vers un pointillé précis (borne haute,
                  dénominateur…). Un simple clic l'ajoute à la racine — ou dans le slot ciblé.
                </p>
                <p>
                  <strong className="text-ink">Emboîtement :</strong> chaque slot accepte n'importe
                  quel bloc, y compris d'autres structures. Une fraction dans une somme, une racine
                  dans une matrice : tout s'imbrique, et se déplace par glisser-déposer.
                </p>
                <p>
                  <strong className="text-ink">Édition :</strong> cliquez sur un terme pour le
                  taper, sur un bloc pour le sélectionner (⌫ supprime), ⌘Z annule. Le code se met à
                  jour en direct à droite.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="min-h-0 lg:h-full">
          <OutputPanel
            latex={tagged}
            code={code}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
            numbered={numbered}
            setNumbered={setNumbered}
          />
        </div>
      </main>

      {/* footer */}
      <footer className="flex items-center justify-between px-5 pb-4 pt-1 text-[11.5px] text-mute">
        <span className="font-medium">
          <span className="mr-1 font-display font-extrabold italic text-pine-700">ƒ.</span>
          Pensé pour les idées, pas pour la syntaxe.
        </span>
        <div className="flex items-center gap-5">
          <span className="hidden items-center gap-1.5 sm:flex">
            <Lock size={11} className="text-sage-400" /> Vos expressions restent sur cet appareil
          </span>
          <div className="relative">
            <button
              onClick={() => setKeysOpen((v) => !v)}
              className="flex items-center gap-1.5 font-semibold text-pine-700 transition hover:text-pine-800"
            >
              <Keyboard size={12} /> Raccourcis clavier
            </button>
            {keysOpen && (
              <div className="rise absolute bottom-7 right-0 z-40 w-56 rounded-xl border border-line bg-panel p-3 shadow-xl">
                {[
                  ["⌘K", "Rechercher un bloc"],
                  ["⌘Z", "Annuler"],
                  ["⌘⇧Z", "Rétablir"],
                  ["⌫", "Supprimer le bloc sélectionné"],
                  ["Échap", "Tout désélectionner"],
                ].map(([k, d]) => (
                  <div key={k} className="flex items-center justify-between py-1">
                    <span className="text-[11.5px] text-mute">{d}</span>
                    <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink">
                      {k}
                    </kbd>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
