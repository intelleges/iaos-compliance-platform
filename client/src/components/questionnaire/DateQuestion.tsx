/**
 * DateQuestion Component
 * Date picker with calendar
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { QuestionComponentProps } from './types';

export function DateQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  // Convert Date to YYYY-MM-DD format for input[type="date"]
  const value = response.responseDate 
    ? new Date(response.responseDate).toISOString().split('T')[0]
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      onChange({ responseDate: new Date(dateStr) });
    } else {
      onChange({ responseDate: null });
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{question.question}</Label>
      {question.hintText && (
        <p className="text-sm text-muted-foreground">{question.hintText}</p>
      )}
      
      <Input
        type="date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full max-w-xs"
      />
    </div>
  );
}
