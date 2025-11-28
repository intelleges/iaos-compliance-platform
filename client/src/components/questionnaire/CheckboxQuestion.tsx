/**
 * CheckboxQuestion Component
 * Single checkbox (acknowledgment)
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { QuestionComponentProps } from './types';

export function CheckboxQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  const checked = response.responseInt === 1;

  const handleChange = (isChecked: boolean) => {
    onChange({ responseInt: isChecked ? 1 : 0 });
  };

  return (
    <div className="space-y-3">
      {question.hintText && (
        <p className="text-sm text-muted-foreground mb-3">{question.hintText}</p>
      )}
      
      <div className="flex items-start space-x-3">
        <Checkbox
          id={`checkbox-${question.id}`}
          checked={checked}
          onCheckedChange={handleChange}
          disabled={disabled}
          className="mt-1"
        />
        <Label 
          htmlFor={`checkbox-${question.id}`}
          className="text-base font-normal cursor-pointer leading-relaxed"
        >
          {question.question}
        </Label>
      </div>
    </div>
  );
}
