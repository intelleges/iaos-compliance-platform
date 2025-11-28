/**
 * CUI (Controlled Unclassified Information) Badge Component
 * Per NIST 800-171 - Visual indicator for CUI-classified data
 * 
 * Displays a prominent badge to alert users when viewing or handling CUI data.
 * Required for compliance with federal information security standards.
 */

import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CUIBadgeProps {
  /**
   * Whether the data is CUI-classified
   */
  isCUI: boolean;
  
  /**
   * Badge variant
   * - "default": Standard badge (for lists, cards)
   * - "prominent": Large banner (for page headers)
   * - "inline": Small inline badge (for form labels)
   */
  variant?: "default" | "prominent" | "inline";
  
  /**
   * Custom className for styling
   */
  className?: string;
}

export function CUIBadge({ isCUI, variant = "default", className = "" }: CUIBadgeProps) {
  if (!isCUI) return null;

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <p className="font-semibold">Controlled Unclassified Information (CUI)</p>
      <p className="text-sm">
        This data is subject to federal safeguarding and dissemination controls per NIST 800-171.
      </p>
      <p className="text-xs text-muted-foreground">
        All access is logged for compliance auditing.
      </p>
    </div>
  );

  if (variant === "prominent") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 rounded ${className}`}
            role="alert"
          >
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Controlled Unclassified Information (CUI)
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This page contains CUI data subject to federal safeguarding requirements
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === "inline") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`ml-2 text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ${className}`}
          >
            <Shield className="h-3 w-3 mr-1" />
            CUI
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default variant
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ${className}`}
        >
          <Shield className="h-3 w-3 mr-1" />
          CUI Protected
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * CUI Warning Banner for Partner/Supplier Pages
 * Displays a prominent warning when suppliers access CUI-classified questionnaires
 */
export function CUIWarningBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}
      role="alert"
    >
      <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100">
          Controlled Unclassified Information (CUI) Notice
        </h3>
        <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <p>
            This questionnaire contains Controlled Unclassified Information (CUI) subject to federal
            safeguarding and dissemination controls.
          </p>
          <p className="font-medium">
            By proceeding, you acknowledge that:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>You are authorized to access this CUI data</li>
            <li>You will protect this information per NIST 800-171 requirements</li>
            <li>All access is logged for compliance auditing</li>
            <li>Unauthorized disclosure may result in civil or criminal penalties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
