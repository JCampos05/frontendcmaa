import { TestBed } from '@angular/core/testing';

import { RondaLiga } from './ronda-liga';

describe('RondaLiga', () => {
  let service: RondaLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RondaLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
