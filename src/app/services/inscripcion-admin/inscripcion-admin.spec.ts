import { TestBed } from '@angular/core/testing';

import { InscripcionAdmin } from './inscripcion-admin';

describe('InscripcionAdmin', () => {
  let service: InscripcionAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InscripcionAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
