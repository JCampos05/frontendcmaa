import { TestBed } from '@angular/core/testing';

import { SesionesActivas } from './sesiones-activas';

describe('SesionesActivas', () => {
  let service: SesionesActivas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SesionesActivas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
