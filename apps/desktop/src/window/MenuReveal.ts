export interface MenuRevealKeyInput {
  readonly type: string;
  readonly key: string;
  readonly meta: boolean;
  readonly control: boolean;
  readonly shift: boolean;
  readonly isAutoRepeat: boolean;
}

export interface MenuRevealOptions {
  readonly reveal: () => void;
}

/**
 * Restores the Alt-to-open application menu on the platforms that draw our own
 * titlebar. `autoHideMenuBar` asks Electron to paint the menubar into the
 * native frame, and `titleBarStyle: "hidden"` removes the frame that would host
 * it, so Alt has nowhere to draw and the configured menu is unreachable. This
 * watches for the same gesture Chromium uses — Alt pressed and released with no
 * other key in between — and pops the application menu below the titlebar
 * instead.
 */
export function makeMenuRevealHandler(
  options: MenuRevealOptions,
): (input: MenuRevealKeyInput) => void {
  let armed = false;

  return (input) => {
    if (input.type === "keyUp") {
      if (input.key !== "Alt") {
        armed = false;
        return;
      }
      if (!armed) return;
      armed = false;
      options.reveal();
      return;
    }
    if (input.type !== "keyDown") return;
    if (input.key !== "Alt") {
      // Alt+Tab, Alt+F4 and every in-app Alt chord land here and cancel the
      // gesture, so only a bare tap ever opens the menu.
      armed = false;
      return;
    }
    // Auto-repeats are the same press still held down; a hold that ends without
    // another key still counts as a tap, matching the native menubar.
    if (input.isAutoRepeat) return;
    armed = !input.control && !input.meta && !input.shift;
  };
}
