import { ChartNoAxesColumnIcon, SettingsIcon } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useEnvironments } from "../../state/environments";
import { PullRequestGlyph } from "../pullRequest/pullRequestIcons";
import { readPullRequestListPreferences } from "../pullRequest/pullRequestListPreferences";
import { openSettings } from "../settings/settingsPresentationStore";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

function DestinationButton({
  icon,
  label,
  onClick,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className="size-[var(--workspace-titlebar-control-size)]! [-webkit-app-region:no-drag]"
            onClick={onClick}
            size="icon"
            variant="ghost"
          >
            {icon}
          </Button>
        }
      />
      <TooltipPopup side="bottom">{label}</TooltipPopup>
    </Tooltip>
  );
}

/** Settings, Pull Requests and Usage, previously the sidebar footer icons. */
export function PrimaryBarDestinations() {
  const navigate = useNavigate();
  const { environments } = useEnvironments();
  // The page reads every connected server, so one of them offering pull requests is enough for
  // the link to lead somewhere.
  const pullRequestsSupported = environments.some(
    (environment) => environment.serverConfig?.environment.capabilities.pullRequests === true,
  );
  const handlePullRequestsClick = useCallback(() => {
    void navigate({ to: "/pull-requests", search: readPullRequestListPreferences() });
  }, [navigate]);
  const handleSettingsClick = useCallback(() => {
    openSettings({ openedAtPathname: window.location.pathname });
  }, []);
  const handleUsageClick = useCallback(() => {
    void navigate({ to: "/usage" });
  }, [navigate]);

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-primary-bar-destinations="">
      {pullRequestsSupported ? (
        <DestinationButton
          icon={<PullRequestGlyph.pullRequest />}
          label="Pull Requests"
          onClick={handlePullRequestsClick}
        />
      ) : null}
      <DestinationButton
        icon={<ChartNoAxesColumnIcon />}
        label="Usage"
        onClick={handleUsageClick}
      />
      <DestinationButton icon={<SettingsIcon />} label="Settings" onClick={handleSettingsClick} />
    </div>
  );
}
