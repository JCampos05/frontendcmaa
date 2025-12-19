import { TestBed } from '@angular/core/testing';

import { Ronda } from './ronda';

describe('Ronda', () => {
  let service: Ronda;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ronda);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
