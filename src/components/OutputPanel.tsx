import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  Code2,
  Copy,
  Download,
  Eye,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { renderMath } from "./M";
import { cn } from "../utils/cn";

interface OutputProps {
  latex: string;
  code: string;
  displayMode: boolean;
  setDisplayMode: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  numbered: boolean;
  setNumbered: (v: boolean) => void;
}

export function OutputPanel(props: OutputProps) {
  const [copied, setCopied] = useState<"code" | "main" | null>(null);

  const lines = useMemo(() => props.code.split("\n"), [props.code]);

  const copy = async (what: "code" | "main") => {
    try {
      await navigator.clipboard.writeText(props.latex);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = props.latex;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };

  const exportTex = () => {
    const doc = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\begin{document}

${props.code}

\\end{document}
`;
    const blob = new Blob([doc], { type: "application/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expression.tex";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="rise nice-scroll flex h-full min-h-0 flex-col gap-4 overflow-y-auto lg:pr-0.5">
      <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_30px_-18px_rgba(31,74,51,0.25)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-600 text-sage-100">
              <Code2 size={15} />
            </span>
            <h2 className="font-display text-[15px] font-semibold tracking-tight">Votre LaTeX</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-pine-700">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine-500" /> En direct
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* render */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-faint">
                Rendu mathématique
              </p>
              <Eye size={13} className="text-faint" />
            </div>
            <div
              className="preview-math dotgrid flex min-h-[96px] items-center justify-center overflow-x-auto rounded-xl border border-line bg-sage-50/50 px-4 py-5 text-center"
              style={{ fontSize: props.fontSize }}
            >
              {props.latex.trim() ? (
                <span dangerouslySetInnerHTML={{ __html: renderMath(props.latex, props.displayMode) }} />
              ) : (
                <span className="text-[12.5px] text-faint">Votre expression apparaîtra ici</span>
              )}
            </div>
          </div>

          {/* code */}
          <div className="overflow-hidden rounded-xl bg-codebg shadow-inner">
            <div className="flex items-center justify-between bg-codehead px-3.5 py-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-codeink">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-400" /> Code LaTeX
              </span>
              <button
                onClick={() => copy("code")}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-codedim transition hover:bg-pine-700 hover:text-codeink"
              >
                {copied === "code" ? <Check size={12} /> : <Copy size={12} />}
                {copied === "code" ? "Copié" : "Copier"}
              </button>
            </div>
            <div className="nice-scroll max-h-[220px] overflow-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.7]">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-4 select-none text-right text-codedim/60">{i + 1}</span>
                  <span className="whitespace-pre text-codeink">{l || " "}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-pine-800 px-3.5 py-1.5 font-mono text-[10px] text-codedim/70">
              <span>LaTeX</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* options */}
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <SlidersHorizontal size={13} className="text-pine-600" /> Options de rendu
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-mute">Mode d'affichage</span>
                <select
                  value={props.displayMode ? "display" : "inline"}
                  onChange={(e) => props.setDisplayMode(e.target.value === "display")}
                  className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] font-medium outline-none focus:border-pine-400"
                >
                  <option value="display">Display style</option>
                  <option value="inline">Inline</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-mute">Taille de la police</span>
                <div className="flex items-center gap-1 rounded-md border border-line bg-panel p-0.5">
                  <button
                    onClick={() => props.setFontSize(Math.max(14, props.fontSize - 2))}
                    className="rounded p-1 text-mute transition hover:bg-sage-100 hover:text-pine-700"
                    aria-label="réduire"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-12 text-center text-[12px] font-medium tabular-nums">
                    {props.fontSize} px
                  </span>
                  <button
                    onClick={() => props.setFontSize(Math.min(48, props.fontSize + 2))}
                    className="rounded p-1 text-mute transition hover:bg-sage-100 hover:text-pine-700"
                    aria-label="agrandir"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-mute">Numéroter l'équation</span>
                <button
                  role="switch"
                  aria-checked={props.numbered}
                  onClick={() => props.setNumbered(!props.numbered)}
                  className={cn(
                    "relative h-[22px] w-[40px] rounded-full transition",
                    props.numbered ? "bg-pine-600" : "bg-line",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all",
                      props.numbered ? "left-[21px]" : "left-[3px]",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* actions */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-panel p-4 shadow-[0_10px_30px_-18px_rgba(31,74,51,0.25)]">
        <button
          onClick={() => copy("main")}
          disabled={!props.latex.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-pine-600 py-3 text-[13.5px] font-semibold text-sage-50 shadow-[0_8px_20px_-10px_rgba(31,74,51,0.7)] transition enabled:hover:bg-pine-700 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          {copied === "main" ? <CheckCheck size={16} /> : <Copy size={16} />}
          {copied === "main" ? "Copié dans le presse-papier" : "Copier le code LaTeX"}
        </button>
        <button
          onClick={exportTex}
          disabled={!props.latex.trim()}
          className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 text-[13px] font-semibold text-ink transition enabled:hover:border-pine-400 enabled:hover:bg-sage-50 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          <span className="flex items-center gap-2">
            <Download size={15} className="text-pine-600" /> Exporter en .tex
          </span>
          <ArrowUpRight size={14} className="text-faint" />
        </button>
        <p className="flex items-center justify-center gap-1.5 pt-0.5 text-[11.5px] text-faint">
          <CheckCheck size={12} className="text-sage-400" /> Prêt pour Overleaf, et partout ailleurs.
        </p>
      </div>
    </aside>
  );
}
