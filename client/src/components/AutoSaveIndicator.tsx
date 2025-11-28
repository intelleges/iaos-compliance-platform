/**
 * Auto-Save Status Indicator
 * Visual feedback for save status with last saved timestamp
 */

import { Check, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveStatus } from '@/hooks/useEnhancedAutoSave';

export interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  queuedChanges?: number;
  onRetry?: () => void;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  error,
  queuedChanges = 0,
  onRetry,
  className,
}: AutoSaveIndicatorProps) {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    // Format as time for older saves
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          iconClassName: 'animate-spin text-blue-600',
          textClassName: 'text-blue-600',
        };
      case 'saved':
        return {
          icon: Check,
          text: 'All changes saved',
          iconClassName: 'text-green-600',
          textClassName: 'text-green-600',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          iconClassName: 'text-red-600',
          textClassName: 'text-red-600',
        };
      case 'offline':
        return {
          icon: CloudOff,
          text: `You're offline${queuedChanges > 0 ? ` (${queuedChanges} changes queued)` : ''}`,
          iconClassName: 'text-orange-600',
          textClassName: 'text-orange-600',
        };
      default:
        return {
          icon: Cloud,
          text: 'Auto-save enabled',
          iconClassName: 'text-gray-400',
          textClassName: 'text-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const lastSavedText = formatLastSaved(lastSaved);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <div className="flex flex-col">
        <span className={cn('font-medium', config.textClassName)}>
          {config.text}
        </span>
        {lastSavedText && status !== 'saving' && (
          <span className="text-xs text-muted-foreground">
            Last saved {lastSavedText}
          </span>
        )}
        {status === 'error' && error && (
          <span className="text-xs text-red-600">
            {error.message}
          </span>
        )}
      </div>
      {(status === 'error' || (status === 'offline' && queuedChanges > 0)) && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Compact Auto-Save Indicator (for headers/toolbars)
 */
export function CompactAutoSaveIndicator({
  status,
  lastSaved,
  className,
}: Pick<AutoSaveIndicatorProps, 'status' | 'lastSaved' | 'className'>) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          className: 'animate-spin text-blue-600',
          tooltip: 'Saving changes...',
        };
      case 'saved':
        return {
          icon: Check,
          className: 'text-green-600',
          tooltip: 'All changes saved',
        };
      case 'error':
        return {
          icon: AlertCircle,
          className: 'text-red-600',
          tooltip: 'Save failed',
        };
      case 'offline':
        return {
          icon: CloudOff,
          className: 'text-orange-600',
          tooltip: "You're offline - changes will be saved when reconnected",
        };
      default:
        return {
          icon: Cloud,
          className: 'text-gray-400',
          tooltip: 'Auto-save enabled',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const lastSavedText = lastSaved ? formatLastSaved(lastSaved) : null;
  
  function formatLastSaved(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', className)}
      title={`${config.tooltip}${lastSavedText ? ` (${lastSavedText})` : ''}`}
    >
      <Icon className={cn('h-3.5 w-3.5', config.className)} />
      {lastSavedText && status === 'saved' && (
        <span className="text-muted-foreground">{lastSavedText}</span>
      )}
    </div>
  );
}
