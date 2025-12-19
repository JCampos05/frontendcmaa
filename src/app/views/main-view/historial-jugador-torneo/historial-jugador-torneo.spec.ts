import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialJugadorTorneo } from './historial-jugador-torneo';

describe('HistorialJugadorTorneo', () => {
  let component: HistorialJugadorTorneo;
  let fixture: ComponentFixture<HistorialJugadorTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialJugadorTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialJugadorTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
