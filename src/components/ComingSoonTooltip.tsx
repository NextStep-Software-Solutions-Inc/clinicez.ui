/**
 * This is custom ShadCN UI coming soon tooltip component
 * Used to indicate features that are not yet available
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ComingSoonTooltipProps extends React.ComponentProps<typeof Tooltip> {
  children: React.ReactNode
  message?: string;
}
export function ComingSoonTooltip({
  children,
  message = "Coming soon!"
}: ComingSoonTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-not-allowed">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}