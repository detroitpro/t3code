# Primary bar

The bar across the top of the window ([`PrimaryBar.tsx`](../../apps/web/src/components/primaryBar/PrimaryBar.tsx))
is the titlebar. It spans the whole window above the sidebar and the main pane,
and it is the only chrome that hosts navigation, so a control has one home.

## Routes fill it without being mounted in it

A route's breadcrumbs and its own controls reach the bar through
[`primaryBarSlots.tsx`](../../apps/web/src/components/primaryBar/primaryBarSlots.tsx):
the bar exposes a `context` and an `actions` region, and routes render into them
with `PrimaryBarSlot`, which portals the DOM while leaving the content in the
route's React tree. That keeps route state, providers and suspense boundaries
where they are, and it is why `WorkspacePageHeader` is a slot rather than a
header element.

Page chrome that is wider than the bar — list filters, search, refresh — belongs
in a row inside the page instead. Usage and Pull Requests do that.

## Geometry has to agree with Electron

Three numbers must match or the bar tears:

- `--workspace-topbar-height` in [`index.css`](../../apps/web/src/index.css) is 40px,
  the same height as the `titleBarOverlay` the desktop window asks for on Windows
  and Linux, and the same as `MACOS_WORKSPACE_TOPBAR_HEIGHT`, which positions the
  macOS traffic lights.
- `--workspace-controls-left` and `--workspace-controls-right` are the bar's
  padding. They already carry the traffic-light inset, the Window Controls Overlay
  inset and the safe-area insets, so the bar never needs to know which platform it
  is on.
- `--workspace-content-top` offsets everything below the bar. The desktop sidebar
  is `position: fixed`, so it cannot be pushed down by flow and reads this instead.

The bar is a drag region on desktop. Interactive children opt out through
`no-drag`, and an `app-region` rectangle beats z-order, so a control that floats
over the bar rather than sitting inside it will not receive clicks.

## The native menu stays installed

On Windows and Linux the menus are HTML, but
[`DesktopApplicationMenu`](../../apps/desktop/src/window/DesktopApplicationMenu.ts)
is still installed and still hidden by `autoHideMenuBar`. Removing it would take
its accelerators with it. A bare `Alt` tap no longer pops it: the gesture in
[`MenuReveal.ts`](../../apps/desktop/src/window/MenuReveal.ts) now sends a
`focus-menubar` action to the renderer, which opens the first HTML menu.

Menu items that only the shell can run go through the single `runAppCommand` IPC.
Its zoom commands must call `DesktopWindow.zoomMain`; the Electron zoom roles
apply to whichever `webContents` is focused, which a preview guest can be.

## Menu items are commands, not handlers

[`menuModel.ts`](../../apps/web/src/components/primaryBar/menuModel.ts) names an
existing `KeybindingCommand` wherever one exists and derives each item's
accelerator label from the user's resolved keybindings, so a rebound command
relabels itself. Choosing the item publishes the command on
[`appCommandBus.ts`](../../apps/web/src/components/primaryBar/appCommandBus.ts),
and the component that owns that command's keyboard handler runs it — the menu
and the shortcut are one code path, and the menus need no second copy of the
behavior.
