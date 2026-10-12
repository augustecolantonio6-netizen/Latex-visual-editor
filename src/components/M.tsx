import { useMemo } from "react";
import katex from "katex";

export function M({ tex, className = "" }: { tex: string; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, strict: false }),
    [tex],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function renderMath(tex: string, displayMode = false): string {
  return katex.renderToString(tex, { throwOnError: false, strict: false, displayMode });
}
