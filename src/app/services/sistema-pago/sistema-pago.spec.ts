import { TestBed } from '@angular/core/testing';

import { SistemaPago } from './sistema-pago';

describe('SistemaPago', () => {
  let service: SistemaPago;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SistemaPago);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
