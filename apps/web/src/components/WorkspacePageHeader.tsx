import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/utils";
import { PrimaryBarSlot } from "./primaryBar/primaryBarSlots";

/**
 * A page's context region inside the primary bar: what the page is, such as a
 * breadcrumb or a title. The content renders in the bar while staying in the
 * route's React tree, so it keeps the route's state and providers.
 *
 * Controls scoped to one thread belong in the thread's own header, and page
 * chrome too wide for the bar, such as list filters, belongs in a row inside
 * the page.
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
