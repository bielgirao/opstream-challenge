import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RequestApiService } from './request-api.service';

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return { api: TestBed.inject(RequestApiService), http: TestBed.inject(HttpTestingController) };
}

describe('RequestApiService', () => {
  it('GETs a draft by id', () => {
    const { api, http } = setup();
    api.getDraft('r 1').subscribe();
    expect(http.expectOne('/api/requests/r%201').request.method).toBe('GET');
  });

  it('PUTs one answer to the contract URL', () => {
    const { api, http } = setup();
    api.saveAnswer('r1', '42', { schemaId: 'software-request', value: 'Laptop' }).subscribe();
    const req = http.expectOne('/api/requests/r1/question/42');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ schemaId: 'software-request', value: 'Laptop' });
  });
});
