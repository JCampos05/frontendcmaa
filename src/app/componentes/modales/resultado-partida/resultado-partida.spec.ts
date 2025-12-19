import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoPartida } from './resultado-partida';

describe('ResultadoPartida', () => {
  let component: ResultadoPartida;
  let fixture: ComponentFixture<ResultadoPartida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoPartida]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadoPartida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
