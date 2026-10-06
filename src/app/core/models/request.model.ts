import { AnswerValue } from './schema.model';

/** A request in progress, as persisted by the backend. Answers are keyed by field id. */
export interface RequestDraft {
  id: string;
  schemaId: string;
  answers: Readonly<Record<string, AnswerValue>>;
  updatedAt: string;
}

/** Body of PUT /api/requests/:id/question/:questionId. */
export interface SaveAnswerBody {
  /** Needed because the contract has no "create request" call: the first save creates the draft. */
  schemaId: string;
  value: AnswerValue;
}

export interface SaveAnswerResponse {
  questionId: string;
  value: AnswerValue;
  savedAt: string;
}
