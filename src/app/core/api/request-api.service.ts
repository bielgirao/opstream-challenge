import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestDraft, SaveAnswerBody, SaveAnswerResponse } from '../models';

/** Thin HTTP layer for requests. Retry and status handling belong to the autosave pipeline. */
@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private readonly http = inject(HttpClient);

  /** Errors with 404 when the request has no saved answers yet. */
  getDraft(requestId: string): Observable<RequestDraft> {
    return this.http.get<RequestDraft>(`/api/requests/${encodeURIComponent(requestId)}`);
  }

  saveAnswer(
    requestId: string,
    questionId: string,
    body: SaveAnswerBody,
  ): Observable<SaveAnswerResponse> {
    return this.http.put<SaveAnswerResponse>(
      `/api/requests/${encodeURIComponent(requestId)}/question/${encodeURIComponent(questionId)}`,
      body,
    );
  }
}
