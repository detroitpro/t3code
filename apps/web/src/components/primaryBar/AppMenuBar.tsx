import { useAtomValue } from "@effect/atom-react";
import { MenuIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { isElectron } from "../../env";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { openCommandPalette } from "../../commandPaletteBus";
import { primaryServerKeybindingsAtom } from "../../state/server";
import { useEnvironments } from "../../state/environments";
import { resolveThreadRouteTarget } from "../../threadRoutes";
import { Button } from "../ui/button";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuShortcut, MenuTrigger } from "../ui/menu";
import { runAppCommand } from "./appCommandBus";
import { runDesktopAppCommand } from "./desktopAppCommands";
import { resolveMenus, type MenuAction, type ResolvedMenu } from "./menuModel";
import { readPullRequestListPreferences } from "../pullRequest/pullRequestListPreferences";

function useMenus(): ReadonlyArray<ResolvedMenu> {
  const keybindings = useAtomValue(primaryServerKeybindingsAtom);
  const { environments } = useEnvironments();
  const routeTarget = useParams({
    strict: false,
    select: (params) => resolveThreadRouteTarget(params),
  });

  return resolveMenus({
    isDesktop: isElectron,
    pullRequestsSupported: environments.some(
      (environment) => environment.serverConfig?.environment.capabilities.pullRequests === true,
    ),
    hasThread: routeTarget !== null,
    // A thread's project is not known outside the thread view, so project-only
    // items stay enabled and their handler decides.
    hasProject: true,
    keybindings,
  });
}

function useRunMenuAction(): (action: MenuAction) => void {
  const navigate = useNavigate();

  return useCallback(
    (action: MenuAction) => {
      switch (action.kind) {
        case "command":
          runAppCommand(action.command);
          return;
        case "navigate":
          void navigate(
            action.to === "/pull-requests"
              ? { to: action.to, search: readPullRequestListPreferences() }
              : { to: action.to },
          );
          return;
        case "palette":
          openCommandPalette(action.open ? { open: action.open } : undefined);
          return;
        case "desktop":
          runDesktopAppCommand(action.command);
          return;
        case "link":
          window.open(action.href, "_blank", "noopener,noreferrer");
      }
    },
    [navigate],
  );
}

function MenuItems({
  menu,
  onAction,
}: {
  readonly menu: ResolvedMenu;
  readonly onAction: (action: MenuAction) => void;
}) {
  return menu.items.map((item) => (
    <div key={item.id}>
      {item.startsGroup ? <MenuSeparator /> : null}
      <MenuItem disabled={item.disabled} onClick={() => onAction(item.action)}>
        {item.label}
        {item.shortcutLabel ? <MenuShortcut>{item.shortcutLabel}</MenuShortcut> : null}
      </MenuItem>
    </div>
  ));
}

/**
 * The File / View / Thread / Go / Help menus. Narrow windows collapse them
 * into a single button, and the desktop app on macOS hides them because the
 * system menu bar already carries the application menu.
 */
export function AppMenuBar() {
  const menus = useMenus();
  const onAction = useRunMenuAction();
  const isMobile = useIsMobile();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const firstMenuId = menus[0]?.id ?? null;

  // The desktop shell turns a bare Alt tap into this action, the gesture the
  // native menu bar answered before this bar replaced it.
  useEffect(() => {
    const onMenuAction = window.desktopBridge?.onMenuAction;
    if (typeof onMenuAction !== "function" || firstMenuId === null) return;
    return onMenuAction((action) => {
      if (action !== "focus-menubar") return;
      setOpenMenuId((current) => (current === null ? firstMenuId : null));
    });
  }, [firstMenuId]);

  if (isMobile) {
    return (
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Application menu"
              className="size-[var(--workspace-titlebar-control-size)]! [-webkit-app-region:no-drag]"
              size="icon"
              variant="ghost"
            >
              <MenuIcon />
            </Button>
          }
        />
        <MenuPopup align="start">
          {menus.map((menu) => (
            <MenuItems key={menu.id} menu={menu} onAction={onAction} />
          ))}
        </MenuPopup>
      </Menu>
    );
  }

  return (
    <div className="flex shrink-0 items-center" data-app-menu-bar="">
      {menus.map((menu) => (
        <Menu
          key={menu.id}
          open={openMenuId === menu.id}
          onOpenChange={(open) => setOpenMenuId(open ? menu.id : null)}
        >
          <MenuTrigger
            render={
              <Button
                className="[-webkit-app-region:no-drag]"
                size="compact"
                variant="ghost"
                // Matches a native menubar: once one menu is open, pointing at
                // its neighbour switches to it without a second click.
                onPointerEnter={() => setOpenMenuId((current) => (current ? menu.id : current))}
              >
                {menu.label}
              </Button>
            }
          />
          <MenuPopup align="start">
            <MenuItems menu={menu} onAction={onAction} />
          </MenuPopup>
        </Menu>
      ))}
    </div>
  );
}
