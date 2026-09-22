import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/utils";
import { PrimaryBarSlot } from "./primaryBar/primaryBarSlots";

/**
 * A page's context region inside the primary bar: breadcrumbs, titles and the
 * controls a route keeps next to them. The content renders in the bar while
 * staying in the route's React tree, so it keeps the route's state and
 * providers. Pages whose header is too wide for the bar, such as list filters,
 * use their own in-page row instead.
 */
export function WorkspacePageHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <PrimaryBarSlot name="context">
      <div
        className={cn("flex min-w-0 flex-1 items-center gap-3", className)}
        data-workspace-page-header=""
        {...props}
      />
    </PrimaryBarSlot>
  );
}
