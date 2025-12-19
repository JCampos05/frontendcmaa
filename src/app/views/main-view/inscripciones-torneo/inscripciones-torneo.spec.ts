import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscripcionesTorneo } from './inscripciones-torneo';

describe('InscripcionesTorneo', () => {
  let component: InscripcionesTorneo;
  let fixture: ComponentFixture<InscripcionesTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionesTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionesTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
