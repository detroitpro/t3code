import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Regions of the primary bar that a route fills in.
 *
 * `context` carries what the page is (breadcrumbs, titles) and `actions` the
 * controls it owns (panel toggles). Routes render into them with
 * `PrimaryBarSlot` and stay where they are in the React tree, so the content
 * keeps the route's providers and state while the DOM lands in the bar.
 */
export type PrimaryBarSlotName = "context" | "actions";

type SlotElements = Partial<Record<PrimaryBarSlotName, HTMLElement | null>>;

interface PrimaryBarSlotRegistry {
  readonly elements: SlotElements;
  readonly register: (name: PrimaryBarSlotName, element: HTMLElement | null) => void;
}

const PrimaryBarSlotContext = createContext<PrimaryBarSlotRegistry | null>(null);

export function PrimaryBarSlotProvider({ children }: { children: ReactNode }) {
  const [elements, setElements] = useState<SlotElements>({});
  // Stable, so the ref callbacks built from it are stable too: a ref that
  // changes identity is detached and reattached on every render, and
  // registering through it would then re-render forever.
  const register = useCallback((name: PrimaryBarSlotName, element: HTMLElement | null) => {
    setElements((current) =>
      current[name] === element ? current : { ...current, [name]: element },
    );
  }, []);
  const value = useMemo<PrimaryBarSlotRegistry>(
    () => ({ elements, register }),
    [elements, register],
  );

  return <PrimaryBarSlotContext value={value}>{children}</PrimaryBarSlotContext>;
}

/** Ref callback the bar attaches to the element backing a slot. */
export function usePrimaryBarSlotRef(name: PrimaryBarSlotName) {
  const registry = use(PrimaryBarSlotContext);
  const register = registry?.register;
  return useCallback((element: HTMLElement | null) => register?.(name, element), [register, name]);
}

/**
 * Renders `children` into the named bar region. Renders nothing until the bar
 * has mounted, which keeps routes usable in tests and on surfaces without one.
 */
export function PrimaryBarSlot({
  name,
  children,
}: {
  readonly name: PrimaryBarSlotName;
  readonly children: ReactNode;
}) {
  const registry = use(PrimaryBarSlotContext);
  const element = registry?.elements[name] ?? null;
  return element ? createPortal(children, element) : null;
}
