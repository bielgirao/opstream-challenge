/** Lifecycle of one question's autosave (ADR-0014). */
export type QuestionSaveState = 'pending' | 'saving' | 'retrying' | 'saved' | 'error';

/** What the save indicator shows for the whole request. */
export type AggregateSaveStatus = 'idle' | 'saving' | 'retrying' | 'saved' | 'error';
