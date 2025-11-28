/**
 * DueDateWidget Component
 * Conditional due date field based on CommentType
 * Based on INT.DOC.08 Section 4.3
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { QuestionComponentProps } from './types';
import { CommentType } from './types';

type DueDateWidgetProps = QuestionComponentProps & {
  show: boolean;
};

export function DueDateWidget({ question, response, onChange, disabled, show }: DueDateWidgetProps) {
  if (!show) return null;

  // Convert Date to YYYY-MM-DD format for input[type="date"]
  const value = response.dueDate 
    ? new Date(response.dueDate).toISOString().split('T')[0]
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      onChange({ dueDate: new Date(dateStr) });
    } else {
      onChange({ dueDate: null });
    }
  };

  return (
    <div className="mt-4 space-y-2 border-l-4 border-primary/30 pl-4">
      <Label className="text-sm font-medium">
        Due Date
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        type="date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full max-w-xs"
      />
      <p className="text-xs text-muted-foreground">
        Specify when this item must be completed
      </p>
    </div>
  );
}

/**
 * Determine if due date widget should be shown based on CommentType and response
 */
export function shouldShowDueDate(commentType: number | null, responseInt: number | null): boolean {
  if (!commentType) return false;

  switch (commentType) {
    case CommentType.YN_DUEDATE_Y:
      return responseInt === 1; // Show when Yes
    default:
      return false;
  }
}
