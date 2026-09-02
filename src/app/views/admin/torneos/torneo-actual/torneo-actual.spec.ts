import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneoActual } from './torneo-actual';

describe('TorneoActual', () => {
  let component: TorneoActual;
  let fixture: ComponentFixture<TorneoActual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneoActual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneoActual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
