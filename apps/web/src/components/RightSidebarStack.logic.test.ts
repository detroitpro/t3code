import { describe, expect, it } from "vite-plus/test";

import {
  clampDockedTerminalHeight,
  RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT,
  RIGHT_SIDEBAR_MIN_TOP_PANE_HEIGHT,
  rightSidebarColumnOpen,
  terminalDockFillsColumn,
} from "./RightSidebarStack.logic";

describe("rightSidebarColumnOpen", () => {
  it("stays open when either the panel or the terminal is open", () => {
    expect(rightSidebarColumnOpen({ rightPanelOpen: true, terminalOpen: false })).toBe(true);
    expect(rightSidebarColumnOpen({ rightPanelOpen: false, terminalOpen: true })).toBe(true);
    expect(rightSidebarColumnOpen({ rightPanelOpen: true, terminalOpen: true })).toBe(true);
    expect(rightSidebarColumnOpen({ rightPanelOpen: false, terminalOpen: false })).toBe(false);
  });
});

describe("terminalDockFillsColumn", () => {
  it("fills only when the surface panel is closed", () => {
    expect(terminalDockFillsColumn({ rightPanelOpen: false })).toBe(true);
    expect(terminalDockFillsColumn({ rightPanelOpen: true })).toBe(false);
  });
});

describe("clampDockedTerminalHeight", () => {
  it("keeps the top pane's minimum when both panes share the column", () => {
    const columnHeight = 800;
    const maxTerminal = columnHeight - RIGHT_SIDEBAR_MIN_TOP_PANE_HEIGHT;
    expect(clampDockedTerminalHeight(900, columnHeight)).toBe(maxTerminal);
    expect(clampDockedTerminalHeight(200, columnHeight)).toBe(200);
  });

  it("never goes below the terminal floor", () => {
    expect(clampDockedTerminalHeight(40, 500)).toBe(RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT);
    expect(clampDockedTerminalHeight(40, 100)).toBe(RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT);
  });

  it("ignores a missing column measurement", () => {
    expect(clampDockedTerminalHeight(280, 0)).toBe(280);
  });
});
