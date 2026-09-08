// Render block progress bar string like [██████░░░░]
export function blocks(progress: number): string {
  const total = 10;
  const filled = Math.round((progress / 100) * total);
  const empty = total - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}
