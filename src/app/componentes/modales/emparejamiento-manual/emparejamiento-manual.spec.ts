import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmparejamientoManual } from './emparejamiento-manual';

describe('EmparejamientoManual', () => {
  let component: EmparejamientoManual;
  let fixture: ComponentFixture<EmparejamientoManual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmparejamientoManual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmparejamientoManual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
