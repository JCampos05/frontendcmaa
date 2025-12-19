import { TestBed } from '@angular/core/testing';

import { LogsSistema } from './logs-sistema';

describe('LogSistema', () => {
  let service: LogsSistema;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogsSistema);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
