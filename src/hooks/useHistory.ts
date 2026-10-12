import { useCallback, useRef, useState } from "react";

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const stateRef = useRef<T>(state);
  stateRef.current = state;
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, bump] = useState(0);

  const set = useCallback((updater: T | ((prev: T) => T), record = true) => {
    if (record) {
      past.current.push(structuredClone(stateRef.current));
      if (past.current.length > 120) past.current.shift();
      future.current = [];
    }
    const next =
      typeof updater === "function" ? (updater as (p: T) => T)(stateRef.current) : updater;
    stateRef.current = next;
    setState(next);
    bump((x) => x + 1);
  }, []);

  /** snapshot now, before a burst of unrecorded edits (e.g. typing) */
  const commit = useCallback(() => {
    past.current.push(structuredClone(stateRef.current));
    if (past.current.length > 120) past.current.shift();
    future.current = [];
    bump((x) => x + 1);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    future.current.push(structuredClone(stateRef.current));
    const prev = past.current.pop()!;
    stateRef.current = prev;
    setState(prev);
    bump((x) => x + 1);
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(structuredClone(stateRef.current));
    const next = future.current.pop()!;
    stateRef.current = next;
    setState(next);
    bump((x) => x + 1);
  }, []);

  return {
    state,
    set,
    commit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
