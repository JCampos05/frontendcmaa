import { TestBed } from '@angular/core/testing';

import { SistemaDesempates } from './sistema-desempates';

describe('SistemaDesempates', () => {
  let service: SistemaDesempates;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SistemaDesempates);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
