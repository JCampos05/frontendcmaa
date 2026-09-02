import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscripcionesLiga } from './inscripciones-liga';

describe('InscripcionesLiga', () => {
  let component: InscripcionesLiga;
  let fixture: ComponentFixture<InscripcionesLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionesLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionesLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
