import { type ReactNode, useLayoutEffect, useRef } from "react";

import { cn } from "~/lib/utils";

import { PreviewPanelShell } from "./preview/PreviewPanelShell";

export {
  clampDockedTerminalHeight,
  RIGHT_SIDEBAR_MIN_TERMINAL_HEIGHT,
  RIGHT_SIDEBAR_MIN_TOP_PANE_HEIGHT,
  rightSidebarColumnOpen,
  terminalDockFillsColumn,
} from "./RightSidebarStack.logic";

interface RightSidebarStackProps {
  open: boolean;
  maximized?: boolean;
  widthStorageKey: string;
  /** Surface panel (tabs + active surface). Null when the panel is not mounted. */
  panel: ReactNode | null;
  /** Whether the surface panel is currently open (vs only retained for exit animation). */
  panelOpen: boolean;
  /** Thread terminal drawer(s) docked under the panel. */
  dock: ReactNode;
  onColumnHeightChange?: (height: number) => void;
}

/**
 * Wide-layout right column: optional surface panel on top, thread terminal docked
 * underneath, sharing one resizable width.
 */
export function RightSidebarStack({
  open,
  maximized = false,
  widthStorageKey,
  panel,
  panelOpen,
  dock,
  onColumnHeightChange,
}: RightSidebarStackProps) {
  const stackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = stackRef.current;
    if (!element || !onColumnHeightChange) return;
    const measure = () => {
      onColumnHeightChange(element.clientHeight);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [onColumnHeightChange]);

  return (
    <PreviewPanelShell
      mode="inline"
      open={open}
      maximized={maximized}
      widthStorageKey={widthStorageKey}
    >
      <div ref={stackRef} className="flex h-full min-h-0 min-w-0 flex-col" data-right-sidebar-stack>
        {panel ? (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden",
              panelOpen ? "flex-1" : "hidden",
            )}
            data-right-sidebar-panel
            data-right-sidebar-panel-open={panelOpen ? "true" : "false"}
          >
            {panel}
          </div>
        ) : null}
        {dock}
      </div>
    </PreviewPanelShell>
  );
}
