import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscripcionesAdmin } from './inscripciones-admin';

describe('InscripcionesAdmin', () => {
  let component: InscripcionesAdmin;
  let fixture: ComponentFixture<InscripcionesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionesAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionesAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
