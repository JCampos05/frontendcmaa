import { TestBed } from '@angular/core/testing';

import { EstadisticasPago } from './estadisticas-pago';

describe('EstadisticasPago', () => {
  let service: EstadisticasPago;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadisticasPago);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
