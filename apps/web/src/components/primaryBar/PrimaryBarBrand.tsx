import { Link } from "@tanstack/react-router";

import { useEnvironmentIdentificationMode } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import {
  resolveEnvironmentIdentificationPillLabel,
  SidebarStageBackdrop,
  useEnvironmentStageLabel,
  useSidebarStageBackdropVariant,
} from "../SidebarStageBackdrop";
import { T3Wordmark } from "../T3Wordmark";
import { Badge } from "../ui/badge";

/**
 * Wordmark plus the dev/nightly marker. The stage artwork sits behind this
 * cluster only: it identifies the instance without tinting the whole bar.
 */
export function PrimaryBarBrand() {
  const stageLabel = useEnvironmentStageLabel();
  const environmentIdentificationMode = useEnvironmentIdentificationMode();
  const backdropVariant = useSidebarStageBackdropVariant(
    environmentIdentificationMode === "artwork",
  );
  const pillLabel =
    environmentIdentificationMode === "pill"
      ? resolveEnvironmentIdentificationPillLabel(stageLabel)
      : null;

  return (
    <div className="relative hidden h-full shrink-0 items-center overflow-hidden px-2 md:flex">
      {backdropVariant ? <SidebarStageBackdrop variant={backdropVariant} /> : null}
      <Link
        aria-label="Go to threads"
        className={cn(
          "relative z-10 flex h-7 w-fit min-w-0 shrink-0 items-center rounded-md outline-hidden ring-ring focus-visible:ring-2 [-webkit-app-region:no-drag]",
          backdropVariant ? "text-white" : "text-foreground",
        )}
        to="/"
      >
        {/* Center the visible capitals, without the font's ascender/descender space. */}
        <span className="inline-flex min-w-0 items-baseline gap-1 text-sm font-medium tracking-tight">
          <T3Wordmark aria-label="T3" className="h-[1cap] w-auto shrink-0" />
          <span
            className={cn(
              "truncate [text-box:trim-both_cap_alphabetic]",
              backdropVariant ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Code
          </span>
        </span>
      </Link>
      {pillLabel ? (
        <Badge
          className="relative z-10 ml-1.5"
          data-environment-identification="pill"
          size="sm"
          variant="secondary"
        >
          {pillLabel}
        </Badge>
      ) : null}
    </div>
  );
}
