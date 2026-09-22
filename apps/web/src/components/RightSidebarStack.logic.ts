/** Minimum height reserved for the right-panel surface when the terminal is docked under it. */
export const RIGHT_SIDEBAR_MIN_TOP_PANE_HEIGHT = 160;

/** Default terminal drawer floor; kept in sync with ThreadTerminalDrawer. */
export const RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT = 180;

/**
 * The inline right column stays open when either the surface panel or the
 * thread terminal is open. Closing one does not collapse the column if the
 * other still needs it.
 */
export function rightSidebarColumnOpen(input: {
  rightPanelOpen: boolean;
  terminalOpen: boolean;
}): boolean {
  return input.rightPanelOpen || input.terminalOpen;
}

/**
 * When the surface panel is closed, the docked terminal fills the column.
 * When both are open, the terminal keeps its persisted pixel height under the panel.
 */
export function terminalDockFillsColumn(input: { rightPanelOpen: boolean }): boolean {
  return !input.rightPanelOpen;
}

/**
 * Clamp a docked terminal height so the top pane keeps a usable minimum when
 * both the panel and terminal share the sidebar column.
 */
export function clampDockedTerminalHeight(
  height: number,
  columnHeight: number,
  options?: {
    minTerminalHeight?: number;
    minTopPaneHeight?: number;
  },
): number {
  const minTerminal = options?.minTerminalHeight ?? RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT;
  const minTopPane = options?.minTopPaneHeight ?? RIGHT_SIDEBAR_MIN_TOP_PANE_HEIGHT;
  const safeHeight = Number.isFinite(height) ? Math.round(height) : minTerminal;
  if (!(columnHeight > 0)) {
    return Math.max(minTerminal, safeHeight);
  }
  const maxForTerminal = Math.max(minTerminal, Math.floor(columnHeight) - minTopPane);
  return Math.min(Math.max(safeHeight, minTerminal), maxForTerminal);
}
