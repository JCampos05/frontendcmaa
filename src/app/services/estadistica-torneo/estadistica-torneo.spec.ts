import { TestBed } from '@angular/core/testing';

import { EstadisticaTorneo } from './estadistica-torneo';

describe('EstadisticaTorneo', () => {
  let service: EstadisticaTorneo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadisticaTorneo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
