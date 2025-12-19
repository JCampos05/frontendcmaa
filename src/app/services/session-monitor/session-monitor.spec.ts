import { TestBed } from '@angular/core/testing';

import { SessionMonitor } from './session-monitor';

describe('SessionMonitor', () => {
  let service: SessionMonitor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionMonitor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
