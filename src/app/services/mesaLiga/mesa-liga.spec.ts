import { TestBed } from '@angular/core/testing';

import { MesaLiga } from './mesa-liga';

describe('MesaLiga', () => {
  let service: MesaLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MesaLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
