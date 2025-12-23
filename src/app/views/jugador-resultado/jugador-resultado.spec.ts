import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugadorResultado } from './jugador-resultado';

describe('JugadorResultado', () => {
  let component: JugadorResultado;
  let fixture: ComponentFixture<JugadorResultado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugadorResultado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JugadorResultado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
