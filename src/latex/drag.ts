import type { DragPayload } from "./types";

let payload: DragPayload | null = null;

export const setDragPayload = (p: DragPayload | null) => {
  payload = p;
};
export const getDragPayload = () => payload;
