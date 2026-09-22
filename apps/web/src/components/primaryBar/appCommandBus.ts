import type { KeybindingCommand } from "@t3tools/contracts";

const APP_COMMAND_EVENT = "t3:app-command";

/**
 * Carries a command from the menus to whichever component owns the state it
 * acts on. Those owners already listen for the command's keybinding on
 * `window`; subscribing here lets a menu item reuse that handler instead of
 * duplicating it, and keeps the keybinding the single definition of what the
 * command does.
 */
export function runAppCommand(command: KeybindingCommand): void {
  window.dispatchEvent(new CustomEvent(APP_COMMAND_EVENT, { detail: command }));
}

export function subscribeAppCommand(listener: (command: KeybindingCommand) => void): () => void {
  const onCommand = (event: Event) => {
    const command = (event as CustomEvent<KeybindingCommand>).detail;
    if (command) listener(command);
  };

  window.addEventListener(APP_COMMAND_EVENT, onCommand);
  return () => window.removeEventListener(APP_COMMAND_EVENT, onCommand);
}
