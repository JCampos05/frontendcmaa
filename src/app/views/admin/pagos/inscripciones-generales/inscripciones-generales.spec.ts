import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscripcionesGenerales } from './inscripciones-generales';

describe('InscripcionesGenerales', () => {
  let component: InscripcionesGenerales;
  let fixture: ComponentFixture<InscripcionesGenerales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionesGenerales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionesGenerales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
