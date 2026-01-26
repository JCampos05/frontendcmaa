import { TestBed } from '@angular/core/testing';

import { JugadorLiga } from './jugador-liga';

describe('JugadorLiga', () => {
  let service: JugadorLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JugadorLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
