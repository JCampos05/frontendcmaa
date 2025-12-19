import { TestBed } from '@angular/core/testing';

import { SistemaCompetencia } from './sistema-competencia';

describe('SistemaCompetencia', () => {
  let service: SistemaCompetencia;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SistemaCompetencia);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
