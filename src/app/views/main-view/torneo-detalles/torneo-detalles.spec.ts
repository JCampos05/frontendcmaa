import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneoDetalles } from './torneo-detalles';

describe('TorneoDetalles', () => {
  let component: TorneoDetalles;
  let fixture: ComponentFixture<TorneoDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneoDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneoDetalles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
