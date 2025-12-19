import { TestBed } from '@angular/core/testing';

import { TorneoCategoria } from './torneo-categoria';

describe('TorneoCategoria', () => {
  let service: TorneoCategoria;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TorneoCategoria);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
