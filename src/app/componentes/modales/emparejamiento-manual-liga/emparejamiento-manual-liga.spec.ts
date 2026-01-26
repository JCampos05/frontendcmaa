import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmparejamientoManualLiga } from './emparejamiento-manual-liga';

describe('EmparejamientoManualLiga', () => {
  let component: EmparejamientoManualLiga;
  let fixture: ComponentFixture<EmparejamientoManualLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmparejamientoManualLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmparejamientoManualLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
