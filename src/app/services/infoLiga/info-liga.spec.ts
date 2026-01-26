import { TestBed } from '@angular/core/testing';

import { InfoLiga } from './info-liga';

describe('InfoLiga', () => {
  let service: InfoLiga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfoLiga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
