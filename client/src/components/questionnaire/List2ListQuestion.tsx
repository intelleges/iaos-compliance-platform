/**
 * List2ListQuestion Component
 * Multi-select checkboxes with Z-Code binary encoding
 * Specialized for socioeconomic business classification
 * Based on INT.DOC.08 Section 4.4
 */

import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import type { QuestionComponentProps } from './types';
import { ZCODE_OPTIONS } from './types';
import { encodeZCode, decodeZCode, formatZCodeBinary } from './zcode';

export function List2ListQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  // Decode current Z-Code into selected codes
  const [selected, setSelected] = useState<string[]>(() => {
    if (response.responseInt !== null && response.responseInt !== undefined) {
      return decodeZCode(response.responseInt);
    }
    return [];
  });

  // Update selected when response changes externally
  useEffect(() => {
    if (response.responseInt !== null && response.responseInt !== undefined) {
      setSelected(decodeZCode(response.responseInt));
    }
  }, [response.responseInt]);

  const handleToggle = (code: string) => {
    const newSelected = selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code];
    
    setSelected(newSelected);
    
    // Encode to Z-Code and save
    const zcode = encodeZCode(newSelected);
    onChange({ responseInt: zcode });
  };

  // Current Z-Code value
  const currentZCode = response.responseInt || 0;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">{question.question}</Label>
        {question.hintText && (
          <p className="text-sm text-muted-foreground mt-1">{question.hintText}</p>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Select all classifications that apply to your business. Multiple selections are allowed.
        </AlertDescription>
      </Alert>

      <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
        {ZCODE_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.code);
          
          return (
            <div key={option.code} className="flex items-start space-x-3">
              <Checkbox
                id={`zcode-${question.id}-${option.code}`}
                checked={isSelected}
                onCheckedChange={() => handleToggle(option.code)}
                disabled={disabled}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor={`zcode-${question.id}-${option.code}`}
                  className="text-base font-medium cursor-pointer"
                >
                  {option.code} - {option.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Weight: {option.weight} | qWeight: {option.qWeight}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Debug info (can be removed in production) */}
      {selected.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded border">
          <div><strong>Selected:</strong> {selected.join(', ')}</div>
          <div><strong>Z-Code (decimal):</strong> {currentZCode}</div>
          <div><strong>Z-Code (binary):</strong> {formatZCodeBinary(currentZCode)}</div>
        </div>
      )}
    </div>
  );
}
