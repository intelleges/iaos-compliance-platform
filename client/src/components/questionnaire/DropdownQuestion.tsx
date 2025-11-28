/**
 * DropdownQuestion Component
 * Select single option from dropdown
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuestionComponentProps } from './types';

export function DropdownQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
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
      
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {question.options.map((option) => (
            <SelectItem key={option.id} value={option.id.toString()}>
              {option.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
