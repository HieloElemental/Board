import type { ColumnConfig } from "../types";

export const COLUMNS: ColumnConfig[] = [
  { key: "waiting", label: "QUEUE", color: "#64748b" },
  { key: "sketch", label: "SKETCH", color: "#7ab8d4" },
  { key: "lineart", label: "LINEART", color: "#3b82f6" },
  { key: "coloring", label: "COLORING", color: "#a855f7" },
  { key: "completed", label: "DELIVERED", color: "#42a86e" },
];
