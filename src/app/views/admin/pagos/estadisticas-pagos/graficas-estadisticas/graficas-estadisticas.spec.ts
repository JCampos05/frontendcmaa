import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficasEstadisticas } from './graficas-estadisticas';

describe('GraficasEstadisticas', () => {
  let component: GraficasEstadisticas;
  let fixture: ComponentFixture<GraficasEstadisticas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficasEstadisticas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficasEstadisticas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
