import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionJugadores } from './gestion-jugadores';

describe('GestionJugadores', () => {
  let component: GestionJugadores;
  let fixture: ComponentFixture<GestionJugadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionJugadores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionJugadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
