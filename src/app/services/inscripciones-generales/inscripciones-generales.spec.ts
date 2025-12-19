import { TestBed } from '@angular/core/testing';

import { InscripcionesGenerales } from './inscripciones-generales';

describe('InscripcionesGenerales', () => {
  let service: InscripcionesGenerales;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InscripcionesGenerales);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
