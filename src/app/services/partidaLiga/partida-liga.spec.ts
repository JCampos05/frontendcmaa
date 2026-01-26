import { TestBed } from '@angular/core/testing';

import { PartidaLiga } from './partida-liga';

describe('PartidaLiga', () => {
  let service: PartidaLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartidaLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
