/**
 * TextQuestion Component
 * Short text: Input field
 * Long text: Textarea
 * Based on INT.DOC.08 Section 4.2
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionComponentProps } from './types';
import { ResponseType } from './types';

export function TextQuestion({ question, response, onChange, disabled }: QuestionComponentProps) {
  const value = response.responseText || '';
  const isLongText = question.responseType === ResponseType.TEXT_LONG;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ responseText: e.target.value });
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{question.question}</Label>
      {question.hintText && (
        <p className="text-sm text-muted-foreground">{question.hintText}</p>
      )}
      
      {isLongText ? (
        <Textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your response..."
          rows={6}
          className="resize-y"
        />
      ) : (
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your response..."
        />
      )}
    </div>
  );
}
