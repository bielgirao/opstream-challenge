/** Lifecycle of one question's autosave (ADR-0014). */
export type QuestionSaveState = 'pending' | 'saving' | 'retrying' | 'saved' | 'error';
