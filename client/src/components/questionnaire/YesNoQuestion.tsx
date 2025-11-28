/**
 * YesNoQuestion Component
 * Radio buttons: Yes (1) / No (0)
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionComponentProps } from './types';

export function YesNoQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  const value = response.responseInt?.toString() || '';

  const handleChange = (val: string) => {
    onChange({ responseInt: parseInt(val, 10) });
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{question.question}</Label>
      {question.hintText && (
        <p className="text-sm text-muted-foreground">{question.hintText}</p>
      )}
      
      <RadioGroup value={value} onValueChange={handleChange} disabled={disabled}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id={`${question.id}-yes`} />
          <Label htmlFor={`${question.id}-yes`} className="font-normal cursor-pointer">
            Yes
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id={`${question.id}-no`} />
          <Label htmlFor={`${question.id}-no`} className="font-normal cursor-pointer">
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
