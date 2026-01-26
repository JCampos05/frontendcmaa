import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugadorLiga } from './jugador-liga';

describe('JugadorLiga', () => {
  let component: JugadorLiga;
  let fixture: ComponentFixture<JugadorLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugadorLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JugadorLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
