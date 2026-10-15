import React from 'react';

export interface FormFeedbackProps {
  feedback: { kind: 'success' | 'error'; text: string } | null;
  hint: string;
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({ feedback, hint }) => {
  if (!feedback) return <>{hint}</>;

  return (
    <span
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={feedback.kind === 'success' ? 'text-success' : 'text-danger'}
    >
      {feedback.text}
    </span>
  );
};
