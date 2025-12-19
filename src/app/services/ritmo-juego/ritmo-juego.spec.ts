import { TestBed } from '@angular/core/testing';

import { RitmoJuego } from './ritmo-juego';

describe('RitmoJuego', () => {
  let service: RitmoJuego;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RitmoJuego);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
