import { TestBed } from '@angular/core/testing';

import { Jugador } from './jugador';

describe('Jugador', () => {
  let service: Jugador;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Jugador);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
