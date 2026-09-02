import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadosTorneo } from './resultados-torneo';

describe('ResultadosTorneo', () => {
  let component: ResultadosTorneo;
  let fixture: ComponentFixture<ResultadosTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadosTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadosTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
