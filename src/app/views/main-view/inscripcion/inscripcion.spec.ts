import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inscripcion } from './inscripcion';

describe('Inscripcion', () => {
  let component: Inscripcion;
  let fixture: ComponentFixture<Inscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inscripcion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inscripcion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
