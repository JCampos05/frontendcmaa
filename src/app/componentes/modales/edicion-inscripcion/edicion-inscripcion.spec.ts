import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdicionInscripcion } from './edicion-inscripcion';

describe('EdicionInscripcion', () => {
  let component: EdicionInscripcion;
  let fixture: ComponentFixture<EdicionInscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdicionInscripcion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdicionInscripcion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
