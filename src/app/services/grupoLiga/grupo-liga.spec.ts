import { TestBed } from '@angular/core/testing';

import { GrupoLiga } from './grupo-liga';

describe('GrupoLiga', () => {
  let service: GrupoLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrupoLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
