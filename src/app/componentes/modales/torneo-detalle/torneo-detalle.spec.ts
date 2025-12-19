import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneoDetalle } from './torneo-detalle';

describe('TorneoDetalle', () => {
  let component: TorneoDetalle;
  let fixture: ComponentFixture<TorneoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneoDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneoDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
