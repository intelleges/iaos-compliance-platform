/**
 * NumberQuestion Component
 * Numeric input with validation
 * DOLLAR type shows $ prefix
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { QuestionComponentProps } from './types';
import { ResponseType } from './types';

export function NumberQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  const value = response.responseInt?.toString() || '';
  const isDollar = question.responseType === ResponseType.DOLLAR;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string or valid numbers
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      const numValue = val === '' ? null : parseFloat(val);
      onChange({ responseInt: numValue });
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{question.question}</Label>
      {question.hintText && (
        <p className="text-sm text-muted-foreground">{question.hintText}</p>
      )}
      
      <div className="relative">
        {isDollar && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
        )}
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={isDollar ? "0.00" : "Enter a number..."}
          className={isDollar ? "pl-7" : ""}
        />
      </div>
    </div>
  );
}
