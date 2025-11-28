/**
 * CommentWidget Component
 * Conditional comment field based on CommentType
 * Based on INT.DOC.08 Section 4.3
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionComponentProps } from './types';
import { CommentType } from './types';

type CommentWidgetProps = QuestionComponentProps & {
  show: boolean;
};

export function CommentWidget({ question, response, onChange, disabled, show }: CommentWidgetProps) {
  if (!show) return null;

  const value = response.comment || '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ comment: e.target.value });
  };

  return (
    <div className="mt-4 space-y-2 border-l-4 border-primary/30 pl-4">
      <Label className="text-sm font-medium">
        Additional Comments
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Please provide additional details..."
        rows={4}
        className="resize-y"
      />
    </div>
  );
}

/**
 * Determine if comment widget should be shown based on CommentType and response
 */
export function shouldShowComment(commentType: number | null, responseInt: number | null): boolean {
  if (!commentType) return false;

  switch (commentType) {
    case CommentType.YN_COMMENT_Y:
      return responseInt === 1; // Show when Yes
    case CommentType.YN_COMMENT_N:
      return responseInt === 0; // Show when No
    case CommentType.COMMENTONLY:
      return true; // Always show
    default:
      return false;
  }
}
