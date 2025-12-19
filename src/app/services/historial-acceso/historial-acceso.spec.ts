import { TestBed } from '@angular/core/testing';

import { HistorialAcceso } from './historial-acceso';

describe('HistorialAcceso', () => {
  let service: HistorialAcceso;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistorialAcceso);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
