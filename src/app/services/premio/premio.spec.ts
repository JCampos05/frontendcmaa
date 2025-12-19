import { TestBed } from '@angular/core/testing';

import { Premio } from './premio';

describe('Premio', () => {
  let service: Premio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Premio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
