import { TestBed } from '@angular/core/testing';

import { HistorialEmparejamiento } from './historial-emparejamiento';

describe('HistorialEmparejamiento', () => {
  let service: HistorialEmparejamiento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistorialEmparejamiento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
