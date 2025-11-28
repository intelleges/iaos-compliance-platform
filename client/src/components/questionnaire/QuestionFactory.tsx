/**
 * QuestionFactory Component
 * Factory pattern that renders the appropriate question widget based on ResponseType
 * Based on INT.DOC.08 Section 4.1
 */

import type { QuestionComponentProps } from './types';
import { ResponseType } from './types';
import { YesNoQuestion } from './YesNoQuestion';
import { YesNoNAQuestion } from './YesNoNAQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { TextQuestion } from './TextQuestion';
import { NumberQuestion } from './NumberQuestion';
import { DateQuestion } from './DateQuestion';
import { CheckboxQuestion } from './CheckboxQuestion';
import { List2ListQuestion } from './List2ListQuestion';
import { CommentWidget, shouldShowComment } from './CommentWidget';
import { UploadWidget, shouldShowUpload } from './UploadWidget';
import { DueDateWidget, shouldShowDueDate } from './DueDateWidget';

export function QuestionFactory(props: QuestionComponentProps) {
  const { question, response } = props;

  // Render main question input based on responseType
  const renderQuestionInput = () => {
    switch (question.responseType) {
      case ResponseType.YES_NO:
        return <YesNoQuestion {...props} />;
      
      case ResponseType.YES_NO_NA:
        return <YesNoNAQuestion {...props} />;
      
      case ResponseType.DROPDOWN:
      case ResponseType.RADIO:
        return <DropdownQuestion {...props} />;
      
      case ResponseType.TEXT_SHORT:
      case ResponseType.TEXT_LONG:
        return <TextQuestion {...props} />;
      
      case ResponseType.NUMBER:
      case ResponseType.DOLLAR:
        return <NumberQuestion {...props} />;
      
      case ResponseType.DATE:
        return <DateQuestion {...props} />;
      
      case ResponseType.CHECKBOX:
        return <CheckboxQuestion {...props} />;
      
      case ResponseType.LIST_TO_LIST:
        return <List2ListQuestion {...props} />;
      
      default:
        // Fallback to text input for unknown types
        console.warn(`Unknown responseType: ${question.responseType}, falling back to TextQuestion`);
        return <TextQuestion {...props} />;
    }
  };

  // Determine which conditional widgets to show
  const showComment = shouldShowComment(question.commentType, response.responseInt ?? null);
  const showUpload = shouldShowUpload(question.commentType, response.responseInt ?? null);
  const showDueDate = shouldShowDueDate(question.commentType, response.responseInt ?? null);

  return (
    <div className="space-y-4">
      {/* Main question input */}
      {renderQuestionInput()}

      {/* Conditional widgets based on CommentType */}
      <CommentWidget {...props} show={showComment} />
      <UploadWidget {...props} show={showUpload} />
      <DueDateWidget {...props} show={showDueDate} />
    </div>
  );
}
