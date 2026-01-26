import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoPartidaLiga } from './resultado-partida-liga';

describe('ResultadoPartidaLiga', () => {
  let component: ResultadoPartidaLiga;
  let fixture: ComponentFixture<ResultadoPartidaLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoPartidaLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadoPartidaLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
